'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { EnrolledCourse, Semester } from '@/lib/types'
import { unenrollCourseAction } from '@/app/actions/courses'
import CourseModal from './CourseModal'
import Link from 'next/link'

interface Props {
  enrolledCourses: EnrolledCourse[]
  semesters: Semester[]
  institutionId: string
}

const CARD_COLORS = [
  'from-blue-100 to-blue-300',
  'from-indigo-100 to-indigo-300',
  'from-violet-100 to-violet-300',
  'from-sky-100 to-sky-300',
  'from-cyan-100 to-cyan-300',
]

type ModalState = {
  open: boolean
  mode: 'add' | 'edit'
  course: EnrolledCourse | null
}

export default function CourseOverview({ enrolledCourses, semesters, institutionId }: Props) {
  const router = useRouter()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add', course: null })
  const [deleteTarget, setDeleteTarget] = useState<EnrolledCourse | null>(null)
  const [isDeleting, startDelete] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openMenuId) return
    const close = () => setOpenMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenuId])

  function openAddModal() {
    setModal({ open: true, mode: 'add', course: null })
  }

  function openEditModal(course: EnrolledCourse) {
    setModal({ open: true, mode: 'edit', course })
    setOpenMenuId(null)
  }

  function handleModalSuccess() {
    router.refresh()
    setModal({ open: false, mode: 'add', course: null })
  }

  function confirmDelete(course: EnrolledCourse) {
    setDeleteTarget(course)
    setDeleteError(null)
    setOpenMenuId(null)
  }

  function handleDelete() {
    if (!deleteTarget) return
    setDeleteError(null)
    const fd = new FormData()
    fd.set('enrollmentId', deleteTarget.enrollment_id)
    startDelete(async () => {
      const result = await unenrollCourseAction(fd)
      if (result?.error) {
        setDeleteError(result.error)
      } else {
        router.refresh()
        setDeleteTarget(null)
      }
    })
  }

  return (
    <section className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
          </div>
          Course Overview
        </h2>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Course
        </button>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {enrolledCourses.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-200 py-14 dark:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-400 dark:bg-indigo-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No courses yet</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add your first course to get started.</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Course
            </button>
          </div>
        ) : (
          enrolledCourses.map((course, index) => {
            const color = CARD_COLORS[index % CARD_COLORS.length]
            const isMenuOpen = openMenuId === course.enrollment_id

            return (
              <div
                key={course.enrollment_id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-white/5 dark:bg-[#151515]"
              >
                <div className={`h-2.5 w-full bg-gradient-to-r ${color}`} />

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight dark:text-white truncate">
                        {course.course_name}
                      </h3>
                      <p className="mt-1.5 text-sm font-medium text-gray-500 line-clamp-1 dark:text-gray-400">
                        {course.professor_name || 'No professor assigned'}
                      </p>
                    </div>

                    {/* Three-dot menu */}
                    <div className="relative ml-2 shrink-0">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setOpenMenuId(prev =>
                            prev === course.enrollment_id ? null : course.enrollment_id
                          )
                        }}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                      </button>

                      {isMenuOpen && (
                        <div
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg dark:border-white/10 dark:bg-[#222]"
                        >
                          <button
                            onClick={() => openEditModal(course)}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:text-gray-300 dark:hover:bg-white/5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(course)}
                            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Exam date */}
                  <div className="mt-8 flex items-center gap-3.5 rounded-xl bg-gray-50 p-4 dark:bg-white/5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-black dark:shadow-none border border-gray-100 dark:border-white/10 text-indigo-600 dark:text-indigo-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-0.5">
                        {course.exam_date ? 'Exam Date' : 'Next Milestone'}
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {course.exam_date
                          ? new Date(course.exam_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'No date set'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-7 flex items-center gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-200 active:scale-[0.98] dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
                      Analytics
                    </button>
                    <Link
                      href={`/practice/${course.enrollment_id}`}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                    >
                      Practice
                    </Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Course edit/add modal */}
      {modal.open && (
        <CourseModal
          mode={modal.mode}
          course={modal.course}
          semesters={semesters}
          institutionId={institutionId}
          onClose={() => setModal({ open: false, mode: 'add', course: null })}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteTarget(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-[#1a1a1a]"
              onClick={e => e.stopPropagation()}
            >
              {/* Warning icon + title */}
              <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Remove course?
                </h3>
                <p className="mt-1 text-sm font-semibold text-gray-600 dark:text-gray-300">
                  {deleteTarget.course_name}
                </p>

                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  This will permanently delete all your personal data for this course, including uploaded notes, study sessions, and practice history. This action cannot be undone.
                </p>

                {deleteError && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 border-t border-gray-100 px-6 py-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 active:scale-[0.98]"
                >
                  {isDeleting ? 'Removing…' : 'Yes, delete course'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
