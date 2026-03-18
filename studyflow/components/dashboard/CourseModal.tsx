'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { EnrolledCourse, Professor, Semester, Course } from '@/lib/types'
import { addCourseEnrollmentAction, editCourseEnrollmentAction } from '@/app/actions/courses'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface LectureEntry {
  day_of_week: number
  start_time: string
  end_time: string
}

const DAYS = [
  { value: 1, label: 'Sunday' },
  { value: 2, label: 'Monday' },
  { value: 3, label: 'Tuesday' },
  { value: 4, label: 'Wednesday' },
  { value: 5, label: 'Thursday' },
  { value: 6, label: 'Friday' },
  { value: 7, label: 'Saturday' },
]

interface Props {
  mode: 'add' | 'edit'
  course: EnrolledCourse | null
  semesters: Semester[]
  institutionId: string
  onClose: () => void
  onSuccess: () => void
}

// ── Shared: Lecture schedule builder ─────────────────────────────────────────

function LectureScheduleSection({
  lectures,
  onAdd,
  onRemove,
  onUpdate,
}: {
  lectures: LectureEntry[]
  onAdd: () => void
  onRemove: (i: number) => void
  onUpdate: (i: number, field: keyof LectureEntry, value: string | number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Lecture Schedule
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors dark:text-blue-400 dark:hover:bg-blue-500/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add
        </button>
      </div>

      {lectures.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-4 text-center text-sm text-gray-400 dark:border-white/10">
          No lectures added yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {lectures.map((lecture, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 dark:border-white/10 dark:bg-white/5"
            >
              <select
                value={lecture.day_of_week}
                onChange={e => onUpdate(i, 'day_of_week', Number(e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
              >
                {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>

              <span className="text-sm text-gray-500 dark:text-gray-400">starting at</span>

              <input
                type="time"
                value={lecture.start_time}
                onChange={e => onUpdate(i, 'start_time', e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
              />

              <span className="text-sm text-gray-500 dark:text-gray-400">ending</span>

              <input
                type="time"
                value={lecture.end_time}
                onChange={e => onUpdate(i, 'end_time', e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
              />

              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-auto rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Shared: Professor picker ──────────────────────────────────────────────────

function ProfessorSection({
  profMode,
  setProfMode,
  professorId,
  setProfessorId,
  professorName,
  setProfessorName,
  availableProfessors,
  loading,
}: {
  profMode: 'select' | 'custom'
  setProfMode: (m: 'select' | 'custom') => void
  professorId: string
  setProfessorId: (id: string) => void
  professorName: string
  setProfessorName: (n: string) => void
  availableProfessors: Professor[]
  loading: boolean
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Professor <span className="text-gray-400 font-normal">(optional)</span>
      </label>
      <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => setProfMode('select')}
          className={`flex-1 py-2 text-sm font-medium transition-colors
            ${profMode === 'select'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'}`}
        >
          Select existing
        </button>
        <button
          type="button"
          onClick={() => setProfMode('custom')}
          className={`flex-1 py-2 text-sm font-medium transition-colors
            ${profMode === 'custom'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'}`}
        >
          Add new
        </button>
      </div>

      {profMode === 'select' ? (
        loading ? (
          <p className="py-2 text-center text-sm text-gray-400">Loading professors…</p>
        ) : availableProfessors.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No professors found for this course. Use "Add new" or leave blank.
          </p>
        ) : (
          <Select
            id="professorId"
            value={professorId}
            onChange={e => setProfessorId(e.target.value)}
          >
            <option value="">— No professor —</option>
            {availableProfessors.map(p => (
              <option key={p.professor_id} value={p.professor_id}>
                {p.professor_name}
              </option>
            ))}
          </Select>
        )
      ) : (
        <Input
          id="professorName"
          value={professorName}
          onChange={e => setProfessorName(e.target.value)}
          placeholder="Professor's full name (optional)"
        />
      )}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function CourseModal({
  mode,
  course,
  semesters,
  institutionId,
  onClose,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // ── Shared ──
  const [examDate, setExamDate] = useState(course?.exam_date?.split('T')[0] ?? '')
  const [lectures, setLectures] = useState<LectureEntry[]>([])
  const [lecturesLoading, setLecturesLoading] = useState(false)

  const activeSemesters = semesters.filter(s => s.is_active)
  const [semesterId, setSemesterId] = useState(
    course?.semester_id ?? activeSemesters[0]?.semester_id ?? ''
  )

  // ── Professor (both modes) ──
  const [profMode, setProfMode] = useState<'select' | 'custom'>('select')
  const [professorId, setProfessorId] = useState(course?.professor_id ?? '')
  const [professorName, setProfessorName] = useState('')
  const [courseProfessors, setCourseProfessors] = useState<Professor[]>([])
  const [professorsLoading, setProfessorsLoading] = useState(false)

  // ── Add mode: course selection ──
  const [courseMode, setCourseMode] = useState<'select' | 'custom'>('select')
  const [courseSearch, setCourseSearch] = useState('')
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [customCourseName, setCustomCourseName] = useState('')

  // Close on Escape + lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Fetch available courses (add mode, select existing)
  useEffect(() => {
    if (mode !== 'add' || courseMode !== 'select' || !institutionId || !semesterId) return
    setCoursesLoading(true)
    setAvailableCourses([])
    setSelectedCourseId('')
    setCourseProfessors([])
    fetch(`/api/courses?institutionId=${institutionId}&semesterId=${semesterId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAvailableCourses(data) })
      .finally(() => setCoursesLoading(false))
  }, [mode, courseMode, institutionId, semesterId])

  // Fetch professors filtered by selected course (add mode) or existing course (edit mode)
  useEffect(() => {
    const targetCourseId =
      mode === 'edit' ? course?.course_id :
      (courseMode === 'select' ? selectedCourseId : null)

    if (!institutionId) return

    if (!targetCourseId) {
      // Custom course in add mode → no existing professors to show
      setCourseProfessors([])
      return
    }

    setProfessorsLoading(true)
    fetch(`/api/professors?institutionId=${institutionId}&courseId=${targetCourseId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCourseProfessors(data) })
      .finally(() => setProfessorsLoading(false))
  }, [mode, courseMode, selectedCourseId, course?.course_id, institutionId])

  // Fetch existing lectures (edit mode)
  useEffect(() => {
    if (mode !== 'edit' || !course) return
    setLecturesLoading(true)
    fetch(`/api/lectures?enrollmentId=${course.enrollment_id}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLectures(data.map((l: any) => ({
            day_of_week: l.day_of_week,
            start_time: l.start_time,
            end_time: l.end_time,
          })))
        }
      })
      .finally(() => setLecturesLoading(false))
  }, [mode, course])

  function handleCourseSelect(courseId: string) {
    setSelectedCourseId(courseId)
    const c = availableCourses.find(c => c.course_id === courseId)
    setExamDate(c?.exam_date?.split('T')[0] ?? '')
    setProfessorId('')  // reset professor when course changes
  }

  const addLecture = () =>
    setLectures(prev => [...prev, { day_of_week: 2, start_time: '09:00', end_time: '11:00' }])

  const removeLecture = (i: number) =>
    setLectures(prev => prev.filter((_, idx) => idx !== i))

  const updateLecture = (i: number, field: keyof LectureEntry, value: string | number) =>
    setLectures(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const fd = new FormData()
    fd.set('lectures', JSON.stringify(lectures))

    if (mode === 'add') {
      fd.set('institutionId', institutionId)
      fd.set('semesterId', semesterId)
      if (examDate) fd.set('examDate', examDate)

      if (courseMode === 'select') {
        if (!selectedCourseId) { setError('Please select a course.'); return }
        fd.set('courseId', selectedCourseId)
      } else {
        if (!customCourseName.trim()) { setError('Please enter a course name.'); return }
        fd.set('courseName', customCourseName.trim())
      }

      if (profMode === 'select' && professorId) fd.set('professorId', professorId)
      else if (profMode === 'custom' && professorName.trim()) fd.set('professorName', professorName.trim())

    } else {
      if (!course) return
      fd.set('enrollmentId', course.enrollment_id)
      fd.set('courseId', course.course_id)
      fd.set('institutionId', institutionId)
      if (examDate) fd.set('examDate', examDate)

      if (profMode === 'select') {
        if (professorId) fd.set('professorId', professorId)
        else fd.set('clearProfessor', '1')
      } else if (professorName.trim()) {
        fd.set('professorName', professorName.trim())
      }
    }

    const action = mode === 'add' ? addCourseEnrollmentAction : editCourseEnrollmentAction
    startTransition(async () => {
      const result = await action(fd)
      if (result?.error) setError(result.error)
      else { router.refresh(); onSuccess() }
    })
  }

  const filteredCourses = availableCourses.filter(c =>
    c.course_name.toLowerCase().includes(courseSearch.toLowerCase())
  )

  const isAddDisabled =
    isPending ||
    !semesterId ||
    (courseMode === 'select' ? !selectedCourseId : false)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl dark:bg-[#1a1a1a]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/10">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {mode === 'add' ? 'Add Course' : 'Edit Course'}
              </h2>
              {mode === 'edit' && course && (
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{course.course_name}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-white/10 dark:hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          {/* Scrollable body */}
          <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
            <div className="space-y-5 p-6">
              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </p>
              )}

              {/* ══ ADD MODE ══ */}
              {mode === 'add' && (
                <>
                  {activeSemesters.length > 1 && (
                    <Select
                      id="semesterId"
                      label="Semester"
                      value={semesterId}
                      onChange={e => setSemesterId(e.target.value)}
                    >
                      {activeSemesters.map(s => (
                        <option key={s.semester_id} value={s.semester_id}>{s.semester_name}</option>
                      ))}
                    </Select>
                  )}

                  {/* Course — select or add new */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Course
                    </label>
                    <div className="flex overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => { setCourseMode('select'); setCourseSearch('') }}
                        className={`flex-1 py-2 text-sm font-medium transition-colors
                          ${courseMode === 'select'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'}`}
                      >
                        Select existing
                      </button>
                      <button
                        type="button"
                        onClick={() => setCourseMode('custom')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors
                          ${courseMode === 'custom'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'}`}
                      >
                        Add new
                      </button>
                    </div>

                    {courseMode === 'select' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={courseSearch}
                          onChange={e => setCourseSearch(e.target.value)}
                          placeholder="Search courses…"
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
                        />
                        <div className="max-h-44 overflow-y-auto space-y-1.5 pr-0.5">
                          {coursesLoading ? (
                            <p className="py-4 text-center text-sm text-gray-400">Loading courses…</p>
                          ) : filteredCourses.length === 0 ? (
                            <p className="py-4 text-center text-sm text-gray-400">
                              {availableCourses.length === 0 ? 'No courses found for this semester.' : 'No matches.'}
                            </p>
                          ) : filteredCourses.map(c => (
                            <label
                              key={c.course_id}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors
                                ${selectedCourseId === c.course_id
                                  ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
                                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'}`}
                            >
                              <input
                                type="radio"
                                name="courseSelect"
                                value={c.course_id}
                                checked={selectedCourseId === c.course_id}
                                onChange={() => handleCourseSelect(c.course_id)}
                                className="mt-0.5 accent-blue-600"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium leading-snug text-gray-900 dark:text-white">
                                  {c.course_name}
                                </p>
                                {c.exam_date && (
                                  <p className="mt-0.5 text-xs text-gray-400">
                                    Exam: {new Date(c.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Input
                        id="customCourseName"
                        value={customCourseName}
                        onChange={e => setCustomCourseName(e.target.value)}
                        placeholder="e.g. Algorithms"
                      />
                    )}
                  </div>

                  {/* Exam date */}
                  <Input
                    id="examDate"
                    label="Exam date (optional)"
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                  />

                  {/* Professor — only shown when a course is selected (select mode) */}
                  {(courseMode === 'custom' || selectedCourseId) && (
                    <ProfessorSection
                      profMode={profMode}
                      setProfMode={setProfMode}
                      professorId={professorId}
                      setProfessorId={setProfessorId}
                      professorName={professorName}
                      setProfessorName={setProfessorName}
                      availableProfessors={courseProfessors}
                      loading={professorsLoading}
                    />
                  )}

                  {/* Lecture schedule */}
                  <LectureScheduleSection
                    lectures={lectures}
                    onAdd={addLecture}
                    onRemove={removeLecture}
                    onUpdate={updateLecture}
                  />
                </>
              )}

              {/* ══ EDIT MODE ══ */}
              {mode === 'edit' && (
                <>
                  {/* Exam date */}
                  <Input
                    id="examDate"
                    label="Exam date (optional)"
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                  />

                  {/* Professor — filtered to course's professors */}
                  <ProfessorSection
                    profMode={profMode}
                    setProfMode={setProfMode}
                    professorId={professorId}
                    setProfessorId={setProfessorId}
                    professorName={professorName}
                    setProfessorName={setProfessorName}
                    availableProfessors={courseProfessors}
                    loading={professorsLoading}
                  />

                  {/* Lecture schedule */}
                  {lecturesLoading ? (
                    <p className="py-3 text-center text-sm text-gray-400">Loading schedule…</p>
                  ) : (
                    <LectureScheduleSection
                      lectures={lectures}
                      onAdd={addLecture}
                      onRemove={removeLecture}
                      onUpdate={updateLecture}
                    />
                  )}

                  {/* Edit Syllabus — placeholder */}
                  <button
                    type="button"
                    disabled
                    title="Coming soon"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed dark:border-white/10 dark:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    Edit Syllabus
                    <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400 dark:bg-white/10">Soon</span>
                  </button>
                </>
              )}
            </div>

            {/* Sticky footer */}
            <div className="flex shrink-0 gap-3 border-t border-gray-100 px-6 py-4 dark:border-white/10">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={mode === 'add' ? isAddDisabled : isPending}
                className="flex-1"
              >
                {isPending
                  ? (mode === 'add' ? 'Adding…' : 'Saving…')
                  : (mode === 'add' ? 'Add Course' : 'Save Changes')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
