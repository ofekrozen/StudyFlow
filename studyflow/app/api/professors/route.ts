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
  const courseId      = searchParams.get('courseId')

  if (!institutionId) {
    return NextResponse.json({ error: 'institutionId is required' }, { status: 400 })
  }

  // If courseId is provided, return only professors linked to that course
  if (courseId) {
    const { data: links } = await supabase
      .from('course_professors')
      .select('professor_id')
      .eq('course_id', courseId)

    const ids = (links ?? []).map(l => l.professor_id)

    if (ids.length === 0) {
      return NextResponse.json([])
    }

    const { data, error } = await supabase
      .from('professors')
      .select('professor_id, institution_id, professor_name')
      .in('professor_id', ids)
      .order('professor_name')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch professors' }, { status: 500 })
    }

    return NextResponse.json(data)
  }

  // Otherwise return all professors for the institution
  const { data, error } = await supabase
    .from('professors')
    .select('professor_id, institution_id, professor_name')
    .eq('institution_id', institutionId)
    .order('professor_name')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch professors' }, { status: 500 })
  }

  return NextResponse.json(data)
}
