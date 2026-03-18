import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BasicsForm from './BasicsForm'
import type { Institution, Semester } from '@/lib/types'

export default async function BasicsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: institutions } = await supabase
    .from('institutions')
    .select('institution_id, institution_name')
    .order('institution_name')

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <StepDot step={1} current={1} />
          <StepLine done={false} />
          <StepDot step={2} current={1} />
          <StepLine done={false} />
          <StepDot step={3} current={1} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your institution</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Select your university and confirm your current semester.
        </p>
      </div>

      <BasicsForm institutions={(institutions ?? []) as Institution[]} />
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
