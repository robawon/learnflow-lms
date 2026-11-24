# LearnFlow: LMS with a Smart Study Planner module

Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase. Theme: white and water blue.

## 1. Set up the database (Supabase > SQL Editor)
Run these files from the `supabase/` folder, in this order. Each one must say "Success" before the next.

0. `00_reset.sql`    OPTIONAL. Only if you ran the OLD setup before. It ERASES all tables and test data in the public schema (accounts in Authentication are kept).
1. `01_schema.sql`   tables
2. `02_security.sql` functions, triggers, row-level security, storage buckets
3. `03_seed.sql`     the 9 study methods and their rules

## 2. Configure the app
1. Copy `.env.example` to `.env.local`.
2. Fill in your Supabase URL and anon key (Project Settings > API).
   The URL must end at `.supabase.co`: no quotes, no trailing slash, no `/rest/v1`.
3. Supabase > Authentication > Providers > Email: turn OFF "Confirm email" while developing.

## 3. Run it
    npm install
    npm run dev
Open http://localhost:3000

## 4. Make yourself admin (once)
Register in the app, then run in the Supabase SQL Editor (use your email):

    update profiles set role = 'admin'
    where id = (select id from auth.users where email = 'YOUR_EMAIL');

Log in again. From the admin area (Users) you can make other accounts instructors.

## 5. Try the whole flow
1. Admin: make a second account an instructor.
2. Instructor: New course > add a module and a lesson > upload a file > Assignments > create one with a due date > Publish.
3. Student: Course catalog > open the course > Enroll > study the lessons.
4. Student: Study Planner > "Plan study" on the assignment. The planner picks a study method and explains why.
5. Open the session: upload your own notes (or attach a course file), view them in the page, use the timer, finish the session.
6. Student: submit the assignment. Instructor: grade it.

## Project structure
    app/                    routes (pages)
      student/ instructor/ admin/   the three signed-in areas
      student/planner/      Study Planner pages (module routes)
    modules/
      lms/actions/          LMS server actions (courses, enrollment, assignments, admin, auth)
      planner/              Study Planner module: suggester engine, actions, timer, finder form
    components/ui/          shared look: AppShell, NavLink, Flash, Logo, Wave...
    components/lms/         LMS-specific components
    lib/                    Supabase clients, helpers, types
    supabase/               SQL files

## Theme
Colours live in `tailwind.config.ts` (the `water` palette). Shared classes (.btn, .card, .input...) live in `app/globals.css`.

## Built so far / next
Done: accounts and roles, courses, modules, lessons, materials, enrollment and approval, progress,
assignments and grading, admin user management, Study Planner (deadlines, sessions, method suggester,
own-material upload and in-page viewer, timer, notes, method rating, missed-session recovery).
Next: quizzes, then planner tasks/availability/reminders, certificates, study groups and discussions, announcements.
