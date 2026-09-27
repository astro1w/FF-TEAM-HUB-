import { supabase } from '@/lib/supabase'

export async function getAdminMetrics() {
  const [users, teams, tryouts, scrims, tournaments, reports] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('tryouts').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('scrims').select('id', { count: 'exact', head: true }).in('status', ['open', 'live']),
    supabase.from('tournaments').select('id', { count: 'exact', head: true }).in('status', ['open', 'live']),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  ])
  return {
    totalUsers: users.count ?? 0,
    activeTeams: teams.count ?? 0,
    openTryouts: tryouts.count ?? 0,
    activeScrims: scrims.count ?? 0,
    activeTournaments: tournaments.count ?? 0,
    pendingReports: reports.count ?? 0
  }
}

export async function listUsers(search?: string) {
  let q = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50)
  if (search) q = q.ilike('nickname', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function setUserStatus(userId: string, status: 'active' | 'suspended' | 'banned', reason?: string, adminId?: string) {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', userId)
  if (error) throw error
  if (adminId) {
    await supabase.from('account_sanctions').insert({
      profile_id: userId,
      status,
      reason: reason || null,
      created_by: adminId
    })
    await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action: `set_status_${status}`,
      target_type: 'profile',
      target_id: userId,
      meta: { reason }
    })
  }
}

export async function setUserRole(userId: string, role: string, adminId: string) {
  const { error } = await supabase.from('profiles').update({ role: role as never }).eq('id', userId)
  if (error) throw error
  await supabase.from('admin_logs').insert({
    admin_id: adminId,
    action: 'set_role',
    target_type: 'profile',
    target_id: userId,
    meta: { role }
  })
}

export async function listReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles:reporter_id(nickname)')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data ?? []
}

export async function updateReportStatus(id: string, status: string, reviewerId: string) {
  const { error } = await supabase
    .from('reports')
    .update({ status, reviewed_by: reviewerId })
    .eq('id', id)
  if (error) throw error
}
