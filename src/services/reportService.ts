import { supabase } from '@/lib/supabase'

export type ReportTargetType = 'player' | 'team' | 'post' | 'comment' | 'message'
export type ReportReason = 'spam' | 'fraud' | 'harassment' | 'fake_account' | 'inappropriate' | 'other'

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'fraud', label: 'Fraude / burla' },
  { value: 'harassment', label: 'Assédio' },
  { value: 'fake_account', label: 'Conta falsa' },
  { value: 'inappropriate', label: 'Conteúdo inadequado' },
  { value: 'other', label: 'Outro' }
]

export async function createReport(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  details?: string
): Promise<void> {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: details?.trim() || null
  })
  if (error) throw error
}
