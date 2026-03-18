import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

interface EnrollmentBody {
  institutionId: string
  semesterId: string
  courseId?: string
  courseName?: string
  examDate?: string
  professorId?: string
  professorName?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. Verify authentication — RLS requires auth.uid() to match
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: EnrollmentBody = await request.json()
  const { institutionId, semesterId, courseId, courseName, examDate, professorId, professorName } = body

  if (!institutionId || !semesterId) {
    return NextResponse.json({ error: 'institutionId and semesterId are required' }, { status: 400 })
  }

  if (!courseId && !courseName) {
    return NextResponse.json({ error: 'Either courseId or courseName is required' }, { status: 400 })
  }

  if (!professorId && !professorName) {
    return NextResponse.json({ error: 'Either professorId or professorName is required' }, { status: 400 })
  }

  try {
    // 2. Create new course if needed (no RLS on courses table)
    let resolvedCourseId = courseId
    if (!resolvedCourseId) {
      const { data: newCourse, error: courseError } = await supabase
        .from('courses')
        .insert({
          institution_id: institutionId,
          semester_id: semesterId,
          course_name: courseName!,
          exam_date: examDate || null,
        })
        .select('course_id')
        .single()

      if (courseError) throw new Error('Failed to create course')
      resolvedCourseId = newCourse.course_id
    }

    // 3. Create new professor if needed (no RLS on professors table)
    let resolvedProfessorId = professorId
    if (!resolvedProfessorId) {
      const { data: newProf, error: profError } = await supabase
        .from('professors')
        .insert({
          institution_id: institutionId,
          professor_name: professorName!,
        })
        .select('professor_id')
        .single()

      if (profError) throw new Error('Failed to create professor')
      resolvedProfessorId = newProf.professor_id
    }

    // 4. Create enrollment — RLS passes because user_id = auth.uid()
    const { data: enrollment, error: enrollError } = await supabase
      .from('course_enrollment')
      .insert({
        user_id: user.id,
        course_id: resolvedCourseId,
        professor_id: resolvedProfessorId,
        is_active: true,
      })
      .select('enrollment_id')
      .single()

    if (enrollError) throw new Error('Failed to create enrollment')

    // 5. Update user's institution — RLS passes (own row)
    await supabase
      .from('users')
      .update({ institution_id: institutionId })
      .eq('user_id', user.id)

    const response = NextResponse.json({ enrollment_id: enrollment.enrollment_id }, { status: 201 })

    // 6. Set the onboarding_complete cookie so middleware skips DB check
    response.cookies.set('onboarding_complete', '1', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })

    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Enrollment failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
