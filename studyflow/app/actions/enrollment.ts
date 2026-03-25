'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function enrollAction(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const institutionId = formData.get('institutionId') as string
  const semesterId = formData.get('semesterId') as string
  const courseId = formData.get('courseId') as string | null
  const courseName = formData.get('courseName') as string | null
  const examDate = formData.get('examDate') as string | null
  const professorId = formData.get('professorId') as string | null
  const professorName = formData.get('professorName') as string | null

  // 1. Resolve or create course
  let resolvedCourseId = courseId || null
  if (!resolvedCourseId && courseName) {
    const { data: newCourse, error } = await supabase
      .from('courses')
      .insert({
        institution_id: institutionId,
        semester_id: semesterId,
        course_name: courseName,
        exam_date: examDate || null,
      })
      .select('course_id')
      .single()

    if (error || !newCourse) redirect('/onboarding/schedule?error=course_create_failed')
    resolvedCourseId = newCourse!.course_id
  }

  // 2. Resolve or create professor
  let resolvedProfessorId = professorId || null
  if (!resolvedProfessorId && professorName) {
    const { data: newProf, error } = await supabase
      .from('professors')
      .insert({
        institution_id: institutionId,
        professor_name: professorName,
      })
      .select('professor_id')
      .single()

    if (error || !newProf) redirect('/onboarding/syllabus?error=professor_create_failed')
    resolvedProfessorId = newProf!.professor_id
  }

  if (!resolvedCourseId) {
    redirect('/onboarding/basics?error=missing_data')
  }

  // 3. Create enrollment
  const { error: enrollError } = await supabase
    .from('course_enrollment')
    .insert({
      user_id: user.id,
      course_id: resolvedCourseId,
      professor_id: resolvedProfessorId,
      is_active: true,
    })

  if (enrollError) redirect('/onboarding/syllabus?error=enrollment_failed')

  // 4. Set user's institution
  await supabase
    .from('users')
    .update({ institution_id: institutionId })
    .eq('user_id', user.id)

  // 5. Set onboarding_complete cookie
  const cookieStore = await cookies()
  cookieStore.set('onboarding_complete', '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  redirect('/dashboard')
}
