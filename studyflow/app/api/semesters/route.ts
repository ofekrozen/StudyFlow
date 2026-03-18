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

  if (!institutionId) {
    return NextResponse.json({ error: 'institutionId is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('semesters')
    .select('semester_id, institution_id, semester_name, semester_start, semester_end, is_active')
    .eq('institution_id', institutionId)
    .eq('is_active', true)
    .order('semester_start', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch semesters' }, { status: 500 })
  }

  return NextResponse.json(data)
}
