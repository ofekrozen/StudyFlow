import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Require authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('institutions')
    .select('institution_id, institution_name')
    .order('institution_name')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch institutions' }, { status: 500 })
  }

  return NextResponse.json(data)
}
