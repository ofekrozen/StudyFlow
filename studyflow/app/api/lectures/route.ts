import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const enrollmentId = searchParams.get('enrollmentId')

  if (!enrollmentId) {
    return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 })
  }

  // Verify ownership — lecture_schedule has no RLS, so enforce manually
  const { data: enrollment } = await supabase
    .from('course_enrollment')
    .select('enrollment_id')
    .eq('enrollment_id', enrollmentId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('lecture_schedule')
    .select('lecture_id, day_of_week, start_time, end_time')
    .eq('enrollment_id', enrollmentId)
    .order('day_of_week')
    .order('start_time')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch lecture schedule' }, { status: 500 })
  }

  return NextResponse.json(data)
}
