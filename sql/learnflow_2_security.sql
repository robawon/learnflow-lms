-- =====================================================================
--  02_security.sql  |  Helper functions, triggers, row-level security, storage.
--  Run after 01_schema.sql.
--  Every "security definer" function pins search_path = public so it works
--  when called by Supabase's auth system (this fixes "Database error creating new user").
-- =====================================================================

-- ---------- HELPER FUNCTIONS ----------

-- True when the logged-in user has the given role.
create or replace function public.current_role_is(r public.user_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = r);
$$;

-- True when the logged-in user is the course's instructor, or an admin.
create or replace function public.owns_course(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.courses where id = cid and instructor_id = auth.uid())
      or public.current_role_is('admin');
$$;

-- True when the logged-in user is actively enrolled in (or has completed) the course.
create or replace function public.is_enrolled(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments
                 where course_id = cid and student_id = auth.uid()
                   and status in ('active', 'completed'));
$$;

-- Returns the course id that a module belongs to.
create or replace function public.course_of_module(mid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select course_id from public.course_modules where id = mid;
$$;

-- Returns the course id that a lesson belongs to.
create or replace function public.course_of_lesson(lid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select m.course_id from public.lessons l join public.course_modules m on m.id = l.module_id where l.id = lid;
$$;

-- Returns the course id that an assignment belongs to.
create or replace function public.course_of_assignment(aid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select course_id from public.assignments where id = aid;
$$;

-- Returns the course id that a course material belongs to.
create or replace function public.course_of_material(mid uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select course_id from public.materials where id = mid;
$$;

-- True when the logged-in user teaches a course that the given student is enrolled in.
create or replace function public.teaches_student(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments e join public.courses c on c.id = e.course_id
                 where e.student_id = sid and c.instructor_id = auth.uid());
$$;

-- True when the logged-in student is enrolled in the assignment's course and may still submit
-- (resubmission is allowed, or they have not submitted yet).
create or replace function public.can_submit(aid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_enrolled(public.course_of_assignment(aid))
     and (
       coalesce((select allow_resubmit from public.assignments where id = aid), false)
       or not exists (select 1 from public.submissions where assignment_id = aid and student_id = auth.uid())
     );
$$;

-- ---------- TRIGGERS ----------

-- Creates the matching profile row after every sign-up. The role is never read from user input,
-- so everyone starts as a student.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email);
  return new;
end $$;

-- Runs handle_new_user() each time a new auth user is created.
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Stops normal users from changing their own role or status through the API.
-- Only admins (or the SQL editor, where there is no logged-in user) may change them.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.current_role_is('admin') then
    new.role := old.role;
    new.status := old.status;
  end if;
  return new;
end $$;

-- Runs protect_profile_columns() before every profile update.
create trigger protect_profile_columns_trigger
  before update on profiles for each row execute function public.protect_profile_columns();

-- ---------- ROW LEVEL SECURITY: turn it on for every table ----------
alter table profiles             enable row level security;
alter table courses              enable row level security;
alter table course_modules       enable row level security;
alter table lessons              enable row level security;
alter table enrollments          enable row level security;
alter table materials            enable row level security;
alter table lesson_progress      enable row level security;
alter table assignments          enable row level security;
alter table submissions          enable row level security;
alter table quizzes              enable row level security;
alter table quiz_questions       enable row level security;
alter table quiz_options         enable row level security;
alter table quiz_attempts        enable row level security;
alter table quiz_answers         enable row level security;
alter table announcements        enable row level security;
alter table notifications        enable row level security;
alter table study_groups         enable row level security;
alter table study_group_members  enable row level security;
alter table discussion_posts     enable row level security;
alter table certificates         enable row level security;
alter table study_methods        enable row level security;
alter table study_method_rules   enable row level security;
alter table personal_materials   enable row level security;
alter table study_sessions       enable row level security;
alter table session_materials    enable row level security;
alter table method_feedback      enable row level security;
alter table study_tasks          enable row level security;
alter table study_availability   enable row level security;
alter table planner_preferences  enable row level security;
-- Tables with no policy below (quizzes, announcements, groups, discussions, certificates)
-- are locked for everyone until their phase adds policies.

-- ---------- LMS POLICIES ----------

-- profiles: you see yourself; instructors see their own students; admins see everyone.
create policy "profiles read" on profiles for select
  using (id = auth.uid() or public.current_role_is('admin') or public.teaches_student(id));
-- profiles: you edit yourself (role and status are protected by the trigger); admins edit anyone.
create policy "profiles update" on profiles for update
  using (id = auth.uid() or public.current_role_is('admin'))
  with check (id = auth.uid() or public.current_role_is('admin'));

-- courses: published ones are public; owners and enrolled students also see drafts/archived.
create policy "courses read" on courses for select
  using (status = 'published' or public.owns_course(id) or public.is_enrolled(id));
-- courses: only instructors (or admins) create courses, and only as themselves.
create policy "courses insert" on courses for insert
  with check ((instructor_id = auth.uid() and public.current_role_is('instructor')) or public.current_role_is('admin'));
create policy "courses update" on courses for update
  using (public.owns_course(id)) with check (public.owns_course(id));
create policy "courses delete" on courses for delete
  using (public.owns_course(id));

-- course_modules, lessons, materials: owner manages, enrolled students read.
create policy "modules owner" on course_modules for all
  using (public.owns_course(course_id)) with check (public.owns_course(course_id));
create policy "modules enrolled read" on course_modules for select
  using (public.is_enrolled(course_id));

create policy "lessons owner" on lessons for all
  using (public.owns_course(public.course_of_module(module_id)))
  with check (public.owns_course(public.course_of_module(module_id)));
create policy "lessons enrolled read" on lessons for select
  using (public.is_enrolled(public.course_of_module(module_id)));

create policy "materials owner" on materials for all
  using (public.owns_course(course_id)) with check (public.owns_course(course_id));
create policy "materials enrolled read" on materials for select
  using (public.is_enrolled(course_id));

-- enrollments: students see their own; instructors see their courses'; admins see all.
create policy "enrollments read" on enrollments for select
  using (student_id = auth.uid() or public.owns_course(course_id));
-- Students enroll themselves, and the status must match the course's enrollment type.
-- Columns are qualified because courses also has a "status" column.
create policy "enrollments student insert" on enrollments for insert
  with check (
    enrollments.student_id = auth.uid()
    and public.current_role_is('student')
    and exists (
      select 1 from courses c
      where c.id = enrollments.course_id and c.status = 'published'
        and ((c.enrollment = 'open' and enrollments.status = 'active')
          or (c.enrollment = 'approval' and enrollments.status = 'pending'))
    )
  );
-- Instructors approve, change or remove enrollments in their own courses.
create policy "enrollments instructor update" on enrollments for update
  using (public.owns_course(course_id)) with check (public.owns_course(course_id));
create policy "enrollments instructor delete" on enrollments for delete
  using (public.owns_course(course_id));
-- Students withdraw by deleting their own enrollment.
create policy "enrollments student delete" on enrollments for delete
  using (student_id = auth.uid());

-- lesson_progress: each student manages only their own progress, in courses they are enrolled in.
create policy "lesson progress own" on lesson_progress for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid() and public.is_enrolled(public.course_of_lesson(lesson_id)));

-- assignments: owner manages, enrolled students read.
create policy "assignments owner" on assignments for all
  using (public.owns_course(course_id)) with check (public.owns_course(course_id));
create policy "assignments enrolled read" on assignments for select
  using (public.is_enrolled(course_id));

-- submissions: students read and create their own (grade fields must be empty on creation).
create policy "submissions student read" on submissions for select
  using (student_id = auth.uid());
create policy "submissions student insert" on submissions for insert
  with check (student_id = auth.uid() and public.can_submit(assignment_id)
              and score is null and feedback is null and graded_at is null);
-- submissions: the course's instructor reads and grades them.
create policy "submissions instructor read" on submissions for select
  using (public.owns_course(public.course_of_assignment(assignment_id)));
create policy "submissions instructor grade" on submissions for update
  using (public.owns_course(public.course_of_assignment(assignment_id)))
  with check (public.owns_course(public.course_of_assignment(assignment_id)));

-- notifications: private to the user.
create policy "notifications own" on notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- STUDY PLANNER POLICIES ----------

-- The method catalog is readable by everyone and editable by admins only.
create policy "methods read" on study_methods for select using (true);
create policy "methods admin" on study_methods for all
  using (public.current_role_is('admin')) with check (public.current_role_is('admin'));
create policy "rules read" on study_method_rules for select using (true);
create policy "rules admin" on study_method_rules for all
  using (public.current_role_is('admin')) with check (public.current_role_is('admin'));

-- Everything a student plans is private to them.
create policy "personal materials own" on personal_materials for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- Sessions: own only, and only for courses/assignments the student is enrolled in.
create policy "sessions own" on study_sessions for all
  using (student_id = auth.uid())
  with check (
    student_id = auth.uid()
    and (course_id is null or public.is_enrolled(course_id))
    and (assignment_id is null or public.is_enrolled(public.course_of_assignment(assignment_id)))
  );

-- Session attachments: only on your own sessions, and only materials you may open.
create policy "session materials own" on session_materials for all
  using (exists (select 1 from study_sessions s where s.id = session_id and s.student_id = auth.uid()))
  with check (
    exists (select 1 from study_sessions s where s.id = session_id and s.student_id = auth.uid())
    and (material_id is null or public.is_enrolled(public.course_of_material(material_id)))
    and (personal_material_id is null or exists (
          select 1 from personal_materials pm where pm.id = personal_material_id and pm.student_id = auth.uid()))
  );

create policy "feedback own" on method_feedback for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "tasks own" on study_tasks for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "availability own" on study_availability for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "preferences own" on planner_preferences for all
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ---------- STORAGE (private buckets) ----------
insert into storage.buckets (id, name, public) values
  ('course-materials', 'course-materials', false),
  ('personal-materials', 'personal-materials', false),
  ('submissions', 'submissions', false),
  ('certificates', 'certificates', false)
on conflict (id) do nothing;

-- course-materials: files are stored as <course_id>/<file>. The CASE keeps the uuid cast
-- from running on other buckets' paths.
create policy "course files owner" on storage.objects for all
  using (case when bucket_id = 'course-materials'
         then public.owns_course(((storage.foldername(name))[1])::uuid) else false end)
  with check (case when bucket_id = 'course-materials'
         then public.owns_course(((storage.foldername(name))[1])::uuid) else false end);
create policy "course files enrolled read" on storage.objects for select
  using (case when bucket_id = 'course-materials'
         then public.is_enrolled(((storage.foldername(name))[1])::uuid) else false end);

-- personal-materials: files are stored as <student_id>/<file>, private to that student.
create policy "personal files own" on storage.objects for all
  using (bucket_id = 'personal-materials' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'personal-materials' and (storage.foldername(name))[1] = auth.uid()::text);

-- submissions: files are stored as <assignment_id>/<student_id>/<file>.
-- Students upload into their own folder while they may still submit.
create policy "submission files student upload" on storage.objects for insert
  with check (case when bucket_id = 'submissions'
         then (storage.foldername(name))[2] = auth.uid()::text
              and public.can_submit(((storage.foldername(name))[1])::uuid)
         else false end);
create policy "submission files student read" on storage.objects for select
  using (bucket_id = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "submission files instructor read" on storage.objects for select
  using (case when bucket_id = 'submissions'
         then public.owns_course(public.course_of_assignment(((storage.foldername(name))[1])::uuid))
         else false end);

-- ---------- BACKFILL ----------
-- Creates profiles for accounts that were registered before this setup (they would otherwise have none).
insert into public.profiles (id, full_name, email)
select id, coalesce(raw_user_meta_data->>'full_name', email), email from auth.users
on conflict (id) do nothing;
