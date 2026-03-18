import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const institutionId = searchParams.get('institutionId')
  const semesterId = searchParams.get('semesterId')

  if (!institutionId || !semesterId) {
    return NextResponse.json({ error: 'institutionId and semesterId are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('courses')
    .select('course_id, institution_id, semester_id, course_name, exam_date')
    .eq('institution_id', institutionId)
    .eq('semester_id', semesterId)
    .is('deleted_at', null)
    .order('course_name')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }

  return NextResponse.json(data)
}
