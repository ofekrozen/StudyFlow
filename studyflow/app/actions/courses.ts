'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

interface LectureEntry {
  day_of_week: number
  start_time: string
  end_time: string
}

// Links a professor to a course in course_professors (no-op if already linked)
async function linkProfessorToCourse(
  supabase: Awaited<ReturnType<typeof import('@/utils/supabase/server').createClient>>,
  courseId: string,
  professorId: string
) {
  const { count } = await supabase
    .from('course_professors')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)
    .eq('professor_id', professorId)

  if ((count ?? 0) === 0) {
    await supabase
      .from('course_professors')
      .insert({ course_id: courseId, professor_id: professorId })
  }
}

// --- ADD COURSE ENROLLMENT ---
export async function addCourseEnrollmentAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const institutionId  = formData.get('institutionId') as string
  const semesterId     = formData.get('semesterId') as string
  const courseId       = (formData.get('courseId') as string) || null
  const courseName     = (formData.get('courseName') as string)?.trim() || null
  const examDate       = (formData.get('examDate') as string) || null
  const professorId    = (formData.get('professorId') as string) || null
  const professorName  = (formData.get('professorName') as string)?.trim() || null
  const lecturesJson   = (formData.get('lectures') as string) || '[]'

  if (!institutionId || !semesterId) {
    return { error: 'Institution and semester are required.' }
  }
  if (!courseId && !courseName) {
    return { error: 'Please select or enter a course name.' }
  }

  // Enforce free plan limit (max 2 active courses)
  const { count } = await supabase
    .from('course_enrollment')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  if ((sub?.plan ?? 'free') === 'free' && (count ?? 0) >= 2) {
    return { error: 'Free plan is limited to 2 active courses. Upgrade to Pro for unlimited courses.' }
  }

  // 1. Resolve or create course
  let resolvedCourseId = courseId
  if (!resolvedCourseId && courseName) {
    const { data: newCourse, error: courseErr } = await supabase
      .from('courses')
      .insert({
        institution_id: institutionId,
        semester_id: semesterId,
        course_name: courseName,
        exam_date: examDate,
      })
      .select('course_id')
      .single()

    if (courseErr || !newCourse) return { error: 'Failed to create course. Please try again.' }
    resolvedCourseId = newCourse.course_id
  }

  if (!resolvedCourseId) return { error: 'Please select or enter a course.' }

  // 2. Resolve or create professor (optional)
  let resolvedProfessorId: string | null = professorId
  if (!resolvedProfessorId && professorName) {
    const { data: newProf, error: profErr } = await supabase
      .from('professors')
      .insert({ institution_id: institutionId, professor_name: professorName })
      .select('professor_id')
      .single()

    if (profErr || !newProf) return { error: 'Failed to create professor.' }
    resolvedProfessorId = newProf.professor_id
  }

  // 3. Create enrollment
  const { data: newEnrollment, error: enrollErr } = await supabase
    .from('course_enrollment')
    .insert({
      user_id: user.id,
      course_id: resolvedCourseId,
      professor_id: resolvedProfessorId,
      is_active: true,
    })
    .select('enrollment_id')
    .single()

  if (enrollErr || !newEnrollment) return { error: 'Enrollment failed. Please try again.' }

  // 4. Link professor to course in course_professors (for future filtering)
  if (resolvedProfessorId) {
    await linkProfessorToCourse(supabase, resolvedCourseId, resolvedProfessorId)
  }

  // 5. Insert lecture schedule (if any)
  let lectures: LectureEntry[] = []
  try { lectures = JSON.parse(lecturesJson) } catch { /* ignore */ }

  if (lectures.length > 0) {
    await supabase.from('lecture_schedule').insert(
      lectures.map(l => ({
        enrollment_id: newEnrollment.enrollment_id,
        day_of_week: l.day_of_week,
        start_time: l.start_time,
        end_time: l.end_time,
      }))
    )
  }

  revalidatePath('/dashboard')
}

// --- EDIT COURSE ENROLLMENT ---
// Updates exam_date, professor (optional), and replaces the lecture schedule.
export async function editCourseEnrollmentAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const enrollmentId  = formData.get('enrollmentId') as string
  const courseId      = formData.get('courseId') as string
  const institutionId = (formData.get('institutionId') as string) || null
  const examDate      = (formData.get('examDate') as string) || null
  const professorId   = (formData.get('professorId') as string) || null
  const professorName = (formData.get('professorName') as string)?.trim() || null
  const clearProf     = formData.get('clearProfessor') === '1'
  const lecturesJson  = (formData.get('lectures') as string) || '[]'

  if (!enrollmentId || !courseId) return { error: 'Missing required fields.' }

  // Verify ownership
  const { data: existing } = await supabase
    .from('course_enrollment')
    .select('enrollment_id')
    .eq('enrollment_id', enrollmentId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!existing) return { error: 'Enrollment not found.' }

  // 1. Update exam date
  const { error: courseErr } = await supabase
    .from('courses')
    .update({ exam_date: examDate })
    .eq('course_id', courseId)

  if (courseErr) return { error: 'Failed to update course.' }

  // 2. Update professor (optional)
  let resolvedProfessorId: string | null = null

  if (clearProf) {
    // Explicitly clear professor
    resolvedProfessorId = null
    await supabase
      .from('course_enrollment')
      .update({ professor_id: null })
      .eq('enrollment_id', enrollmentId)
  } else if (professorId) {
    resolvedProfessorId = professorId
    await supabase
      .from('course_enrollment')
      .update({ professor_id: professorId })
      .eq('enrollment_id', enrollmentId)
  } else if (professorName && institutionId) {
    const { data: newProf, error: profErr } = await supabase
      .from('professors')
      .insert({ institution_id: institutionId, professor_name: professorName })
      .select('professor_id')
      .single()

    if (profErr || !newProf) return { error: 'Failed to create professor.' }
    resolvedProfessorId = newProf.professor_id
    await supabase
      .from('course_enrollment')
      .update({ professor_id: resolvedProfessorId })
      .eq('enrollment_id', enrollmentId)
  }

  // Link new professor to course in course_professors
  if (resolvedProfessorId && courseId) {
    await linkProfessorToCourse(supabase, courseId, resolvedProfessorId)
  }

  // 3. Replace lecture schedule
  let lectures: LectureEntry[] = []
  try { lectures = JSON.parse(lecturesJson) } catch {
    return { error: 'Invalid lecture schedule data.' }
  }

  const { error: deleteErr } = await supabase
    .from('lecture_schedule')
    .delete()
    .eq('enrollment_id', enrollmentId)

  if (deleteErr) return { error: 'Failed to update lecture schedule.' }

  if (lectures.length > 0) {
    const { error: insertErr } = await supabase
      .from('lecture_schedule')
      .insert(
        lectures.map(l => ({
          enrollment_id: enrollmentId,
          day_of_week: l.day_of_week,
          start_time: l.start_time,
          end_time: l.end_time,
        }))
      )
    if (insertErr) return { error: 'Failed to save lecture schedule.' }
  }

  revalidatePath('/dashboard')
}

// --- UNENROLL (SOFT DELETE) ---
export async function unenrollCourseAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const enrollmentId = formData.get('enrollmentId') as string
  if (!enrollmentId) return { error: 'Missing enrollment ID.' }

  // Verify ownership before mutations
  const { data: existing } = await supabase
    .from('course_enrollment')
    .select('enrollment_id')
    .eq('enrollment_id', enrollmentId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!existing) return { error: 'Enrollment not found.' }

  // Soft-delete uploaded materials first (tolerate failure gracefully)
  await supabase
    .from('user_course_materials')
    .update({ deleted_at: new Date().toISOString() })
    .eq('enrollment_id', enrollmentId)
    .is('deleted_at', null)

  // Delete lecture schedule entries
  await supabase
    .from('lecture_schedule')
    .delete()
    .eq('enrollment_id', enrollmentId)

  // Soft-delete enrollment
  const { error } = await supabase
    .from('course_enrollment')
    .update({ is_active: false, deleted_at: new Date().toISOString() })
    .eq('enrollment_id', enrollmentId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to remove course. Please try again.' }

  revalidatePath('/dashboard')
}
