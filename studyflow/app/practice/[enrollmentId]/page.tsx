import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { CourseSubject } from "@/lib/types";
import PracticeClient from "./PracticeClient";

type Props = {
  params: Promise<{ enrollmentId: string }>;
};

export default async function PracticeCoursePage({ params }: Props) {
  const { enrollmentId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify enrollment ownership
  const { data: enrollment } = await supabase
    .from("course_enrollment")
    .select("enrollment_id, course_id, professor_id")
    .eq("enrollment_id", enrollmentId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!enrollment) redirect("/practice");

  // Fetch course details
  const { data: course } = await supabase
    .from("courses")
    .select("course_name")
    .eq("course_id", enrollment.course_id)
    .single();

  // Fetch course subjects
  const { data: subjects } = await supabase
    .from("course_subjects")
    .select("subject_id, subject_name, subject_description")
    .eq("course_id", enrollment.course_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  // Check if past exams exist for this professor/course combo
  const { data: courseProfessor } = await supabase
    .from("course_professors")
    .select("course_professor_id")
    .eq("course_id", enrollment.course_id)
    .eq("professor_id", enrollment.professor_id)
    .maybeSingle();

  let hasExams = false;
  if (courseProfessor) {
    const { count } = await supabase
      .from("course_professor_exams")
      .select("course_professor_exam_id", { count: "exact", head: true })
      .eq("course_professor_id", courseProfessor.course_professor_id);
    hasExams = (count ?? 0) > 0;
  }

  return (
    <PracticeClient
      enrollmentId={enrollmentId}
      courseName={course?.course_name ?? "Course"}
      subjects={(subjects ?? []) as Pick<CourseSubject, "subject_id" | "subject_name" | "subject_description">[]}
      hasExams={hasExams}
    />
  );
}
