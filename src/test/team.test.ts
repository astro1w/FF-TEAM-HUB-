import { describe, it, expect } from 'vitest'

// Regra de negócio: uma Team nunca pode ficar sem capitão.
// A garantia real vive no trigger SQL (prevent_captain_removal, migration 0002);
// este teste documenta e protege a mesma regra ao nível da lógica de app.

interface Member {
  id: string
  teamRole: 'Captain' | 'Vice Captain' | 'Rush' | 'IGL' | 'Support' | 'Sniper' | 'Flex'
}

function canRemoveMember(members: Member[], memberId: string): boolean {
  const target = members.find((m) => m.id === memberId)
  if (!target) return false
  if (target.teamRole !== 'Captain') return true
  const otherCaptains = members.filter((m) => m.teamRole === 'Captain' && m.id !== memberId)
  return otherCaptains.length > 0
}

describe('gestão de lineup', () => {
  it('impede remover o único capitão', () => {
    const members: Member[] = [{ id: '1', teamRole: 'Captain' }, { id: '2', teamRole: 'Rush' }]
    expect(canRemoveMember(members, '1')).toBe(false)
  })

  it('permite remover capitão se houver outro capitão', () => {
    const members: Member[] = [
      { id: '1', teamRole: 'Captain' },
      { id: '2', teamRole: 'Captain' }
    ]
    expect(canRemoveMember(members, '1')).toBe(true)
  })

  it('permite remover membro que não é capitão', () => {
    const members: Member[] = [{ id: '1', teamRole: 'Captain' }, { id: '2', teamRole: 'Rush' }]
    expect(canRemoveMember(members, '2')).toBe(true)
  })
})
