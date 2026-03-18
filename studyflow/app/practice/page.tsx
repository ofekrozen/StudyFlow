import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

const COURSE_COLORS = [
  "from-blue-100 to-blue-300 dark:from-blue-900/40 dark:to-blue-700/40",
  "from-violet-100 to-violet-300 dark:from-violet-900/40 dark:to-violet-700/40",
  "from-emerald-100 to-emerald-300 dark:from-emerald-900/40 dark:to-emerald-700/40",
  "from-amber-100 to-amber-300 dark:from-amber-900/40 dark:to-amber-700/40",
];

type EnrollmentWithCourse = {
  enrollment_id: string;
  course_id: string;
  courses: {
    course_name: string;
    exam_date: string | null;
  } | null;
};

export default async function PracticePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawEnrollments } = await supabase
    .from("course_enrollment")
    .select("enrollment_id, course_id, courses(course_name, exam_date)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const enrollments = (rawEnrollments ?? []) as unknown as EnrollmentWithCourse[];

  // Fetch topic counts for all enrolled courses
  const courseIds = enrollments.map((e) => e.course_id);
  const subjectCountMap: Record<string, number> = {};
  if (courseIds.length > 0) {
    const { data: subjectRows } = await supabase
      .from("course_subjects")
      .select("course_id")
      .in("course_id", courseIds)
      .eq("is_active", true)
      .is("deleted_at", null);
    (subjectRows ?? []).forEach((row: { course_id: string }) => {
      subjectCountMap[row.course_id] = (subjectCountMap[row.course_id] ?? 0) + 1;
    });
  }

  return (
    <div className="flex flex-col gap-10 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 px-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
          <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 dark:text-white">Practice</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 pl-1">
          Select a course to start practicing with Socratic questions, homework review, and exam-style exercises.
        </p>
      </div>

      {/* Course Grid */}
      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515] p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No courses yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Add a course from the dashboard to start practicing.</p>
          </div>
          <Link
            href="/dashboard"
            className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment, index) => {
            const color = COURSE_COLORS[index % COURSE_COLORS.length];
            const courseName = enrollment.courses?.course_name ?? "Unknown Course";
            const examDate = enrollment.courses?.exam_date;

            return (
              <div
                key={enrollment.enrollment_id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-white/5 dark:bg-[#151515]"
              >
                {/* Gradient accent bar */}
                <div className={`h-2.5 w-full bg-gradient-to-r ${color}`} />

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex flex-1 flex-col gap-4">
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight leading-tight dark:text-white">
                      {courseName}
                    </h3>

                    {(subjectCountMap[enrollment.course_id] ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500 dark:text-indigo-400 shrink-0"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {subjectCountMap[enrollment.course_id]} topics
                        </span>
                      </div>
                    )}

                    {examDate ? (
                      <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-white/5 px-4 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-black border border-gray-100 dark:border-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Exam Date</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {new Date(examDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 dark:bg-white/5 px-4 py-3">
                        <p className="text-sm text-gray-400 dark:text-gray-500">No exam date set</p>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/practice/${enrollment.enrollment_id}`}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                  >
                    Start Practicing
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
