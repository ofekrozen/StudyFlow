import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CourseForm from './CourseForm'
import type { Course } from '@/lib/types'

interface Props {
  searchParams: Promise<{ institutionId?: string; semesterId?: string }>
}

export default async function SchedulePage({ searchParams }: Props) {
  const params = await searchParams
  const { institutionId, semesterId } = params

  if (!institutionId || !semesterId) redirect('/onboarding/basics')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: courses } = await supabase
    .from('courses')
    .select('course_id, institution_id, semester_id, course_name, exam_date')
    .eq('institution_id', institutionId)
    .eq('semester_id', semesterId)
    .is('deleted_at', null)
    .order('course_name')

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <StepDot step={1} current={2} />
          <StepLine done={true} />
          <StepDot step={2} current={2} />
          <StepLine done={false} />
          <StepDot step={3} current={2} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Choose a course</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select from your semester&apos;s course list, or add a custom one.
        </p>
      </div>

      <CourseForm
        courses={(courses ?? []) as Course[]}
        institutionId={institutionId}
        semesterId={semesterId}
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
