'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Institution, Semester } from '@/lib/types'

export default function BasicsForm({ institutions }: { institutions: Institution[] }) {
  const router = useRouter()
  const [institutionId, setInstitutionId] = useState(institutions[0]?.institution_id ?? '')
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [semesterId, setSemesterId] = useState('')
  const [loading, setLoading] = useState(false)

  // Fetch semesters whenever institution changes
  useEffect(() => {
    if (!institutionId) return
    setLoading(true)
    fetch(`/api/semesters?institutionId=${institutionId}`)
      .then(r => r.json())
      .then((data: Semester[]) => {
        setSemesters(data)
        setSemesterId(data[0]?.semester_id ?? '')
      })
      .finally(() => setLoading(false))
  }, [institutionId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!institutionId || !semesterId) return
    router.push(`/onboarding/schedule?institutionId=${institutionId}&semesterId=${semesterId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="institution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          University
        </label>
        <select
          id="institution"
          value={institutionId}
          onChange={e => setInstitutionId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          {institutions.map(inst => (
            <option key={inst.institution_id} value={inst.institution_id}>
              {inst.institution_name}
            </option>
          ))}
        </select>
      </div>

      {semesters.length > 0 && (
        <div>
          <label htmlFor="semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current semester
          </label>
          <select
            id="semester"
            value={semesterId}
            onChange={e => setSemesterId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
          >
            {semesters.map(sem => (
              <option key={sem.semester_id} value={sem.semester_id}>
                {sem.semester_name}
              </option>
            ))}
          </select>
          {semesters[0] && (
            <p className="mt-1 text-xs text-gray-400">
              {new Date(semesters.find(s => s.semester_id === semesterId)?.semester_start ?? '').toLocaleDateString('en-IL')}
              {' – '}
              {new Date(semesters.find(s => s.semester_id === semesterId)?.semester_end ?? '').toLocaleDateString('en-IL')}
            </p>
          )}
        </div>
      )}

      {loading && (
        <p className="text-sm text-gray-400">Loading semesters…</p>
      )}

      <button
        type="submit"
        disabled={!institutionId || !semesterId || loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </form>
  )
}
