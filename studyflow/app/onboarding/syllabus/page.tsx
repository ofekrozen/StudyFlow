import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfessorForm from './ProfessorForm'
import type { Professor, Course } from '@/lib/types'

interface Props {
  searchParams: Promise<{
    institutionId?: string
    semesterId?: string
    courseId?: string
    courseName?: string
    examDate?: string
  }>
}

export default async function SyllabusPage({ searchParams }: Props) {
  const params = await searchParams
  const { institutionId, semesterId, courseId, courseName, examDate } = params

  if (!institutionId || !semesterId || (!courseId && !courseName)) {
    redirect('/onboarding/basics')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch professors and (if courseId) the course name for the summary
  const [{ data: professors }, { data: courseData }] = await Promise.all([
    supabase
      .from('professors')
      .select('professor_id, institution_id, professor_name')
      .eq('institution_id', institutionId)
      .order('professor_name'),
    courseId
      ? supabase
          .from('courses')
          .select('course_name, exam_date')
          .eq('course_id', courseId)
          .single()
      : Promise.resolve({ data: null }),
  ])

  const displayCourseName = courseData?.course_name ?? courseName ?? ''
  const displayExamDate = courseData?.exam_date ?? examDate ?? null

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <StepDot step={1} current={3} />
          <StepLine done={true} />
          <StepDot step={2} current={3} />
          <StepLine done={true} />
          <StepDot step={3} current={3} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Who teaches it?</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select your professor, then confirm your enrollment.
        </p>
      </div>

      {/* Summary card */}
      <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Selected course</p>
        <p className="font-semibold text-gray-900 dark:text-white">{displayCourseName}</p>
        {displayExamDate && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Exam: {new Date(displayExamDate).toLocaleDateString('en-IL')}
          </p>
        )}
      </div>

      <ProfessorForm
        professors={(professors ?? []) as Professor[]}
        institutionId={institutionId}
        semesterId={semesterId}
        courseId={courseId ?? null}
        courseName={courseName ?? null}
        examDate={examDate ?? null}
      />
    </div>
  )
}

function StepDot({ step, current }: { step: number; current: number }) {
  const done = step < current
  const active = step === current
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors
      ${done ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900' : 'bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}>
      {done ? '✓' : step}
    </div>
  )
}

function StepLine({ done }: { done: boolean }) {
  return (
    <div className={`h-0.5 flex-1 rounded-full ${done ? 'bg-blue-600' : 'bg-gray-200 dark:bg-white/10'}`} />
  )
}
