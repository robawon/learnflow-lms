-- =====================================================================
--  01_schema.sql  |  LearnFlow: LMS + Study Planner module
--  Tables, types and indexes. Run first (after 00_reset.sql if you used it).
-- =====================================================================

-- ---------- ENUM TYPES ----------
create type user_role        as enum ('student', 'instructor', 'admin');
create type account_status   as enum ('active', 'suspended', 'pending');
create type course_status    as enum ('draft', 'published', 'archived');
create type enroll_type      as enum ('open', 'approval', 'restricted');
create type enroll_status    as enum ('pending', 'active', 'withdrawn', 'completed');
create type task_status      as enum ('pending', 'completed', 'overdue');
create type session_status   as enum ('planned', 'in_progress', 'completed', 'partial', 'missed', 'rescheduled');
create type priority_level   as enum ('low', 'medium', 'high');
create type course_kind      as enum ('theory', 'problem_solving', 'programming', 'writing');
create type assessment_kind  as enum ('none', 'quiz', 'assignment', 'midterm', 'final');

-- =====================================================================
--  LMS MODULE
-- =====================================================================

-- Users (one row per account; created automatically on sign-up)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text,
  role        user_role not null default 'student',
  status      account_status not null default 'active',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Courses
create table courses (
  id               uuid primary key default gen_random_uuid(),
  instructor_id    uuid not null references profiles(id),
  title            text not null,
  description      text,
  category         text,
  kind             course_kind not null default 'theory',  -- used by the study method suggester
  objectives       text,
  prerequisites    text,
  thumbnail_url    text,
  enrollment       enroll_type not null default 'open',
  status           course_status not null default 'draft',
  min_quiz_score   numeric default 50,
  created_at       timestamptz not null default now()
);

create table course_modules (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses(id) on delete cascade,
  title      text not null,
  position   int not null default 0
);

create table lessons (
  id         uuid primary key default gen_random_uuid(),
  module_id  uuid not null references course_modules(id) on delete cascade,
  title      text not null,
  content    text,
  position   int not null default 0,
  required   boolean not null default true
);

create table enrollments (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  course_id   uuid not null references courses(id) on delete cascade,
  status      enroll_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table materials (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses(id) on delete cascade,
  module_id  uuid references course_modules(id) on delete set null,
  title      text not null,
  file_path  text not null,           -- path in the course-materials bucket
  file_type  text,
  created_at timestamptz not null default now()
);

create table lesson_progress (
  student_id   uuid not null references profiles(id) on delete cascade,
  lesson_id    uuid not null references lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

-- Assignments and submissions
create table assignments (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references courses(id) on delete cascade,
  title          text not null,
  instructions   text,
  due_at         timestamptz not null,
  max_score      numeric default 100,
  allow_resubmit boolean default false,
  required       boolean default true
);

create table submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id    uuid not null references profiles(id) on delete cascade,
  text_answer   text,
  file_path     text,
  submitted_at  timestamptz not null default now(),
  score         numeric,
  feedback      text,
  graded_at     timestamptz
);

-- Quizzes (built in a later phase; tables are ready)
create table quizzes (
  id            uuid primary key default gen_random_uuid(),
  course_id     uuid not null references courses(id) on delete cascade,
  lesson_id     uuid references lessons(id) on delete set null,
  title         text not null,
  opens_at      timestamptz,
  due_at        timestamptz,
  duration_min  int,
  pass_score    numeric default 50,
  max_attempts  int default 1,
  shuffle       boolean default true
);
create table quiz_questions (
  id        uuid primary key default gen_random_uuid(),
  quiz_id   uuid not null references quizzes(id) on delete cascade,
  prompt    text not null,
  position  int not null default 0
);
create table quiz_options (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  label       text not null,
  is_correct  boolean not null default false
);
create table quiz_attempts (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references quizzes(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  score       numeric,
  passed      boolean,
  started_at  timestamptz not null default now(),
  finished_at timestamptz
);
create table quiz_answers (
  attempt_id  uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  option_id   uuid references quiz_options(id),
  primary key (attempt_id, question_id)
);

-- Communication (later phases; tables are ready)
create table announcements (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references courses(id) on delete cascade,
  author_id  uuid not null references profiles(id),
  title      text not null,
  body       text,
  created_at timestamptz not null default now()
);
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null,
  message    text not null,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create table study_groups (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid references courses(id) on delete set null,
  name       text not null,
  goal       text,
  owner_id   uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
create table study_group_members (
  group_id   uuid not null references study_groups(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  primary key (group_id, student_id)
);
create table discussion_posts (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid references courses(id) on delete cascade,
  group_id   uuid references study_groups(id) on delete cascade,
  parent_id  uuid references discussion_posts(id) on delete cascade,
  author_id  uuid not null references profiles(id),
  body       text not null,
  reported   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Certificates (later phase; table is ready)
create table certificates (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references profiles(id) on delete cascade,
  course_id     uuid not null references courses(id) on delete cascade,
  code          text not null unique,
  file_path     text,
  issued_at     timestamptz not null default now(),
  unique (student_id, course_id)
);

-- =====================================================================
--  STUDY PLANNER MODULE
-- =====================================================================

-- Study method catalog and the rules that choose between them
create table study_methods (
  id          serial primary key,
  slug        text not null unique,
  name        text not null,
  description text not null,
  best_for    text not null,
  steps       jsonb not null default '[]',
  min_minutes int default 25
);

-- A rule matches when ALL its non-null conditions hold; the highest total weight wins.
-- "reason" is shown to the student as "Why this method?".
create table study_method_rules (
  id              serial primary key,
  method_id       int not null references study_methods(id) on delete cascade,
  course_kind     course_kind,
  assessment      assessment_kind,
  max_days_left   int,
  min_days_left   int,
  max_confidence  int,
  max_last_score  numeric,
  min_session_min int,
  weight          int not null default 1,
  reason          text not null
);

-- Student's own uploaded study material (private)
create table personal_materials (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  course_id   uuid references courses(id) on delete set null,
  title       text not null,
  file_path   text not null,           -- path in the personal-materials bucket
  file_type   text,
  created_at  timestamptz not null default now()
);

-- Planned study sessions
create table study_sessions (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references profiles(id) on delete cascade,
  course_id        uuid references courses(id) on delete set null,
  assignment_id    uuid references assignments(id) on delete set null,
  method_id        int references study_methods(id),
  method_reason    text,
  title            text not null,
  planned_start    timestamptz not null,
  planned_minutes  int not null check (planned_minutes > 0),
  status           session_status not null default 'planned',
  actual_minutes   int,
  notes            text,
  rescheduled_from uuid references study_sessions(id) on delete set null,
  created_at       timestamptz not null default now()
);

-- Materials attached to a session: a course material OR a personal upload (exactly one)
create table session_materials (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid not null references study_sessions(id) on delete cascade,
  material_id           uuid references materials(id) on delete cascade,
  personal_material_id  uuid references personal_materials(id) on delete cascade,
  check ((material_id is not null)::int + (personal_material_id is not null)::int = 1)
);

-- "Did this method help?" rating after a session
create table method_feedback (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references study_sessions(id) on delete cascade,
  student_id  uuid not null references profiles(id) on delete cascade,
  method_id   int not null references study_methods(id),
  rating      int not null check (rating between 1 and 5),
  created_at  timestamptz not null default now(),
  unique (session_id)
);

-- Tables for later planner features (tasks, availability, preferences)
create table study_tasks (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references profiles(id) on delete cascade,
  course_id      uuid references courses(id) on delete set null,
  assignment_id  uuid references assignments(id) on delete set null,
  quiz_id        uuid references quizzes(id) on delete set null,
  title          text not null,
  due_at         timestamptz,
  priority       priority_level not null default 'medium',
  est_minutes    int,
  status         task_status not null default 'pending',
  confidence     int check (confidence between 1 and 5),
  created_at     timestamptz not null default now()
);
create table study_availability (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references profiles(id) on delete cascade,
  weekday     int not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  check (end_time > start_time)
);
create table planner_preferences (
  student_id        uuid primary key references profiles(id) on delete cascade,
  remind_minutes    int not null default 15,
  daily_goal_min    int default 120,
  weekly_goal_min   int default 600,
  streaks_enabled   boolean default true,
  prefers_group     boolean default false
);

-- ---------- INDEXES ----------
create index on enrollments (student_id);
create index on enrollments (course_id);
create index on assignments (course_id, due_at);
create index on submissions (assignment_id);
create index on study_sessions (student_id, planned_start);
create index on session_materials (session_id);
create index on notifications (user_id, is_read);
