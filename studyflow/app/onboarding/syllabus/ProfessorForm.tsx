'use client'

import { useState, useTransition } from 'react'
import { enrollAction } from '@/app/actions/enrollment'
import type { Professor } from '@/lib/types'

interface Props {
  professors: Professor[]
  institutionId: string
  semesterId: string
  courseId: string | null
  courseName: string | null
  examDate: string | null
}

export default function ProfessorForm({ professors, institutionId, semesterId, courseId, courseName, examDate }: Props) {
  const [mode, setMode] = useState<'select' | 'custom'>('select')
  const [selectedProfId, setSelectedProfId] = useState(professors[0]?.professor_id ?? '')
  const [customName, setCustomName] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    // Inject non-input values
    formData.set('institutionId', institutionId)
    formData.set('semesterId', semesterId)
    if (courseId) formData.set('courseId', courseId)
    if (courseName) formData.set('courseName', courseName)
    if (examDate) formData.set('examDate', examDate)
    if (mode === 'select') {
      formData.set('professorId', selectedProfId)
      formData.delete('professorName')
    } else {
      formData.set('professorName', customName)
      formData.delete('professorId')
    }

    startTransition(() => enrollAction(formData))
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
          Choose professor
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
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {professors.map(prof => (
            <label
              key={prof.professor_id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors
                ${selectedProfId === prof.professor_id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5'}`}
            >
              <input
                type="radio"
                name="professor"
                value={prof.professor_id}
                checked={selectedProfId === prof.professor_id}
                onChange={() => setSelectedProfId(prof.professor_id)}
                className="accent-blue-600"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {prof.professor_name}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Professor name
          </label>
          <input
            type="text"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="e.g. פרופ' ישראל כהן"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || (mode === 'select' ? !selectedProfId : !customName.trim())}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Enrolling…' : 'Start learning →'}
      </button>
    </form>
  )
}
