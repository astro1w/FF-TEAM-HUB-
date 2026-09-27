import { supabase } from '@/lib/supabase'
import type { ApplyToTryoutInput, CreateTryoutInput, Tryout, Application } from '@/types/tryout'

function rowToTryout(row: any): Tryout {
  return {
    id: row.id,
    teamId: row.team_id,
    title: row.title,
    roleSought: row.role_sought,
    slots: row.slots,
    requirements: row.requirements,
    description: row.description,
    closesAt: row.closes_at,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    teamName: row.teams?.name,
    teamTag: row.teams?.tag,
    teamLogoUrl: row.teams?.logo_url,
    teamCountry: row.teams?.country
  }
}

export async function listTryouts(filters?: {
  role?: string
  country?: string
  status?: string
}): Promise<Tryout[]> {
  let query = supabase
    .from('tryouts')
    .select('*, teams(name, tag, logo_url, country)')
    .order('created_at', { ascending: false })
    .limit(40)

  if (filters?.status) query = query.eq('status', filters.status)
  else query = query.eq('status', 'open')

  if (filters?.role) query = query.eq('role_sought', filters.role)

  const { data, error } = await query
  if (error) throw error

  let results = (data ?? []).map((row: any) => rowToTryout(row))

  if (filters?.country) {
    results = results.filter((t) => t.teamCountry === filters.country)
  }

  return results
}

export async function getTryout(id: string): Promise<Tryout | null> {
  const { data, error } = await supabase
    .from('tryouts')
    .select('*, teams(name, tag, logo_url, country)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return rowToTryout(data)
}

export async function createTryout(input: CreateTryoutInput, userId: string): Promise<Tryout> {
  const { data, error } = await supabase
    .from('tryouts')
    .insert({
      team_id: input.teamId,
      title: input.title.trim(),
      role_sought: input.roleSought,
      slots: input.slots,
      requirements: input.requirements?.trim() || null,
      description: input.description?.trim() || null,
      closes_at: input.closesAt || null,
      created_by: userId,
      status: 'open'
    })
    .select('*, teams(name, tag, logo_url, country)')
    .single()

  if (error) throw error
  return rowToTryout(data)
}

export async function applyToTryout(input: ApplyToTryoutInput, applicantId: string): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      tryout_id: input.tryoutId,
      applicant_id: applicantId,
      message: input.message?.trim() || null,
      experience: input.experience?.trim() || null,
      availability: input.availability?.trim() || null,
      video_url: input.videoUrl?.trim() || null,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    tryoutId: data.tryout_id,
    applicantId: data.applicant_id,
    message: data.message,
    experience: data.experience,
    availability: data.availability,
    videoUrl: data.video_url,
    status: data.status,
    createdAt: data.created_at
  }
}

export async function listApplicationsForTryout(tryoutId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*, profiles(nickname)')
    .eq('tryout_id', tryoutId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    tryoutId: row.tryout_id,
    applicantId: row.applicant_id,
    message: row.message,
    experience: row.experience,
    availability: row.availability,
    videoUrl: row.video_url,
    status: row.status,
    createdAt: row.created_at,
    applicantNickname: row.profiles?.nickname
  }))
}

export async function updateApplicationStatus(
  applicationId: string,
  status: 'accepted' | 'rejected'
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId)

  if (error) throw error
}
