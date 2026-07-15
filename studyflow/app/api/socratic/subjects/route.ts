import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { calculateBattery } from '@/app/api/socratic/utils/battery'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const enrollmentId = request.nextUrl.searchParams.get('enrollment_id')
  if (!enrollmentId) {
    return NextResponse.json({ error: 'enrollment_id is required' }, { status: 400 })
  }

  try {
    // Verify enrollment ownership and get course_id
    const { data: enrollment } = await supabase
      .from('course_enrollment')
      .select('enrollment_id, course_id')
      .eq('enrollment_id', enrollmentId)
      .eq('user_id', user.id)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Fetch active subjects for this course
    const { data: subjects, error: subjectsError } = await supabase
      .from('course_subjects')
      .select('subject_id, subject_name, subject_description')
      .eq('course_id', enrollment.course_id)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (subjectsError) throw new Error('Failed to fetch subjects')

    // Fetch mastery rows for this enrollment (RLS handles ownership)
    const { data: masteryRows } = await supabase
      .from('subject_mastery')
      .select('subject_id, mastery_score, decay_rate, last_practiced_at')
      .eq('enrollment_id', enrollmentId)

    const masteryMap = new Map(
      (masteryRows ?? []).map((m) => [m.subject_id, m])
    )

    const enriched = (subjects ?? []).map((subject) => {
      const mastery = masteryMap.get(subject.subject_id)
      const battery = mastery
        ? calculateBattery(mastery.mastery_score, mastery.decay_rate, mastery.last_practiced_at)
        : calculateBattery(0, 0.23, null)

      return {
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
        subject_description: subject.subject_description,
        battery,
        mastery_score: mastery?.mastery_score ?? 0,
        last_practiced_at: mastery?.last_practiced_at ?? null,
      }
    })

    return NextResponse.json(enriched)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch subjects'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
