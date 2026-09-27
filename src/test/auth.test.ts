import { describe, it, expect } from 'vitest'

// Testes de validação (Fase 1). Não fazem chamadas reais ao Supabase —
// isolam apenas a lógica de validação usada nos formulários de auth.

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email)
}

function isStrongPassword(password: string) {
  return password.length >= 8
}

describe('validação de autenticação', () => {
  it('rejeita emails inválidos', () => {
    expect(isValidEmail('não-é-email')).toBe(false)
    expect(isValidEmail('jogador@exemplo.com')).toBe(true)
  })

  it('exige password com pelo menos 8 caracteres', () => {
    expect(isStrongPassword('1234567')).toBe(false)
    expect(isStrongPassword('12345678')).toBe(true)
  })
})
