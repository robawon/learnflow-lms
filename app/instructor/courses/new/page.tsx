import CourseFields from "@/components/lms/CourseFields";
import Flash from "@/components/ui/Flash";
import { createCourse } from "@/modules/lms/actions/courses";

// "New course" page: a form that creates a draft course and then opens the course editor.
export default function NewCoursePage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <form action={createCourse} className="card max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">New course</h1>
      <Flash error={searchParams.error} />
      <CourseFields />
      <button className="btn">Create course</button>
    </form>
  );
}
