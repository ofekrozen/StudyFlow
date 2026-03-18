import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { EnrolledCourse, Semester } from '@/lib/types'
import CourseOverview from '@/components/dashboard/CourseOverview'

// Fake tasks data (to be replaced when task management is built)
const TASKS = [
  { id: 1, title: 'Upload Notes: CS101', type: 'upload_notes', time: 'Due in 2 hrs', priority: 'high' },
  { id: 2, title: 'Daily Review: Calc II', type: 'daily_review', time: 'Due today', priority: 'medium' },
  { id: 3, title: 'Concept Check: Physics', type: 'concept_check', time: 'Due tomorrow', priority: 'low' },
]

function computeSemesterProgress(sem: Semester | null): number {
  if (!sem) return 0
  const now = Date.now()
  const start = new Date(sem.semester_start).getTime()
  const end = new Date(sem.semester_end).getTime()
  if (now <= start) return 0
  if (now >= end) return 100
  return Math.round(((now - start) / (end - start)) * 100)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's institution
  const { data: userRow } = await supabase
    .from('users')
    .select('institution_id')
    .eq('user_id', user.id)
    .single()

  const institutionId = userRow?.institution_id ?? null

  // Enrolled courses via JOIN
  const { data: rawEnrollments } = await supabase
    .from('course_enrollment')
    .select(`
      enrollment_id, course_id, professor_id, is_active,
      courses ( course_name, exam_date, semester_id, institution_id ),
      professors ( professor_name )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const enrolledCourses: EnrolledCourse[] = (rawEnrollments ?? []).map(row => ({
    enrollment_id: row.enrollment_id,
    course_id: row.course_id,
    professor_id: row.professor_id,
    is_active: row.is_active,
    course_name: (row.courses as any)?.course_name ?? '',
    exam_date: (row.courses as any)?.exam_date ?? null,
    semester_id: (row.courses as any)?.semester_id ?? '',
    institution_id: (row.courses as any)?.institution_id ?? '',
    professor_name: (row.professors as any)?.professor_name ?? '',
  }))

  // Active semesters (for the modal semester picker + progress bar)
  const { data: semestersData } = institutionId
    ? await supabase
        .from('semesters')
        .select('semester_id, institution_id, semester_name, semester_start, semester_end, is_active')
        .eq('institution_id', institutionId)
        .eq('is_active', true)
        .order('semester_start', { ascending: false })
    : { data: [] }

  const semesters = (semestersData ?? []) as Semester[]

  const activeSemester = semesters.find(s => s.is_active) ?? null
  const semesterProgress = computeSemesterProgress(activeSemester)

  return (
    <div className="flex flex-col gap-10 pb-12">

      {/* Dashboard Header Title */}
      <div className="mb-2 px-2">
        <h1 className="text-3xl tracking-tight font-extrabold text-gray-900 dark:text-white">Main Dashboard</h1>
      </div>

      {/* 1. Hero Section: Semester Progress */}
      <section className="relative overflow-hidden rounded-2xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gray-100 dark:bg-[#111] dark:ring-white/5 shrink-0">
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {activeSemester?.semester_name ?? 'Current Semester'}
            </h2>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
                {semesterProgress}
              </span>
              <span className="text-sm font-bold text-gray-400">%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100/80 dark:bg-gray-800/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000 ease-in-out relative overflow-hidden"
              style={{ width: `${semesterProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite] -translate-x-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "Next Task" Queue */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
            Next Task Queue
          </h2>
          <button className="group flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            View all
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5"><path d="m9 18 6-6-6-6"></path></svg>
          </button>
        </div>

        {/* Horizontal Scrollable Task List */}
        <div className="flex gap-5 overflow-x-auto pb-6 pt-2 px-2 -mx-2 snap-x snap-mandatory scrollbar-hide">
          {TASKS.map((task) => (
            <div
              key={task.id}
              className="group relative flex w-[300px] shrink-0 snap-start flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 dark:border-white/5 dark:bg-[#151515] dark:hover:border-blue-500/30 dark:hover:bg-[#1a1a1a]"
            >
              <div className="flex items-start justify-between">
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                  task.priority === 'high' ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20' :
                  task.priority === 'medium' ? 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20' :
                  'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                }`}>
                  {task.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  {task.time}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2 dark:text-white mt-2">
                {task.title}
              </h3>

              <div className="mt-auto pt-6 border-t border-gray-100 dark:border-white/5">
                <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-black hover:shadow-lg hover:shadow-gray-900/20 active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-gray-100 dark:hover:shadow-white/20">
                  <span>Start Task</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Course Overview Grid (Client Component) */}
      <CourseOverview
        enrolledCourses={enrolledCourses}
        semesters={semesters}
        institutionId={institutionId ?? ''}
      />

    </div>
  )
}
