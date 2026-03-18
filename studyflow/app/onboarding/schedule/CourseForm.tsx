'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Course } from '@/lib/types'

interface Props {
  courses: Course[]
  institutionId: string
  semesterId: string
}

export default function CourseForm({ courses, institutionId, semesterId }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<'select' | 'custom'>('select')
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.course_id ?? '')
  const [search, setSearch] = useState('')
  const [customName, setCustomName] = useState('')
  const [examDate, setExamDate] = useState('')

  const filtered = courses.filter(c =>
    c.course_name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const base = `/onboarding/syllabus?institutionId=${institutionId}&semesterId=${semesterId}`

    if (mode === 'select' && selectedCourseId) {
      router.push(`${base}&courseId=${selectedCourseId}`)
    } else if (mode === 'custom' && customName) {
      const params = new URLSearchParams({ institutionId, semesterId, courseName: customName })
      if (examDate) params.set('examDate', examDate)
      router.push(`/onboarding/syllabus?${params.toString()}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => setMode('select')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors
            ${mode === 'select' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400'}`}
        >
          Choose existing
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors
            ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400'}`}
        >
          Add custom
        </button>
      </div>

      {mode === 'select' ? (
        <div className="space-y-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
          />
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-4 text-center text-sm text-gray-400">No courses found.</p>
            )}
            {filtered.map(course => (
              <label
                key={course.course_id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors
                  ${selectedCourseId === course.course_id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5'}`}
              >
                <input
                  type="radio"
                  name="course"
                  value={course.course_id}
                  checked={selectedCourseId === course.course_id}
                  onChange={() => setSelectedCourseId(course.course_id)}
                  className="mt-0.5 accent-blue-600"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                    {course.course_name}
                  </p>
                  {course.exam_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Exam: {new Date(course.exam_date).toLocaleDateString('en-IL')}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Course name
            </label>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="e.g. אלגוריתמים — Algorithms"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exam date <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={mode === 'select' ? !selectedCourseId : !customName.trim()}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </form>
  )
}
