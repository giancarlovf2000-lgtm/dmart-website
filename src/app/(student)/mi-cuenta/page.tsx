import { createClient } from '@/lib/supabase/server'
import StudentDashboard from './StudentDashboard'

export const dynamic = 'force-dynamic'

export default async function MiCuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: contrib } = user
    ? await supabase.from('content_contributors').select('full_name, type').eq('id', user.id).single()
    : { data: null }

  const name = contrib?.full_name || (user?.user_metadata?.full_name as string) || 'estudiante'
  return <StudentDashboard name={name} userId={user!.id} />
}
