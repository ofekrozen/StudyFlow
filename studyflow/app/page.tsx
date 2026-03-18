import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

// Root page — just redirects based on auth state.
// All heavy logic lives in middleware; this is a safety net.
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
