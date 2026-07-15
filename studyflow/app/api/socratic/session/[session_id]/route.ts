import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  const { session_id } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // RLS on socratic_tutor_sessions enforces ownership via course_enrollment
    const { data: session } = await supabase
      .from('socratic_tutor_sessions')
      .select('*')
      .eq('session_id', session_id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch session'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
