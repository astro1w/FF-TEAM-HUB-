/**
 * Estado interno de cada funcionalidade (não é mostrado aos utilizadores).
 *  REAL      — completamente funcional
 *  PARTIAL   — parcialmente funcional
 *  PREPARED  — arquitetura preparada, integração/UI futura
 *  MOCK      — apenas demonstração visual
 * Regra: nunca apresentar PREPARED ou MOCK como se fosse REAL.
 */
export type FeatureStatus = 'REAL' | 'PARTIAL' | 'PREPARED' | 'MOCK'

export const FEATURE_STATUS: Record<string, { status: FeatureStatus; note: string }> = {
  auth_email: { status: 'REAL', note: 'Registo e login por email/password (Supabase Auth).' },
  auth_google: { status: 'PREPARED', note: 'Botão existe; falta ativar o provider Google no Supabase e configurar o retorno à app.' },
  profiles_onboarding: { status: 'REAL', note: 'Perfil competitivo com função, nível, disponibilidade e bio.' },
  image_upload: { status: 'REAL', note: 'Avatar, logo de Team, imagem de post e banner de torneio; comprimidas no telemóvel.' },
  competitive_id: { status: 'REAL', note: 'ID FTH-MZ-XXXXXX gerado e protegido no servidor (imutável).' },
  verification_players: { status: 'REAL', note: 'Só o admin atribui/remove o selo; testado contra auto-atribuição.' },
  verification_teams: { status: 'PREPARED', note: 'Ainda não há coluna nem botão para verificar equipas.' },
  feed_threads: { status: 'REAL', note: 'Publicar, responder em cadeia, gostar, republicar (contagem), eliminar, denunciar, partilhar texto.' },
  feed_reposts_in_timeline: { status: 'PREPARED', note: 'Republicações são contadas mas ainda não aparecem no feed de quem segue.' },
  feed_share_link: { status: 'PREPARED', note: 'Partilha o texto do post; links precisam de um domínio público (a app ainda não tem).' },
  follows_players: { status: 'REAL', note: 'Seguir/deixar de seguir jogadores; separador "A seguir" no feed.' },
  follows_lists: { status: 'PARTIAL', note: 'Mostra contagens de seguidores/a seguir; ainda sem as listas de pessoas.' },
  follows_teams: { status: 'PREPARED', note: 'Base de dados pronta; falta o botão nas páginas de equipas.' },
  notifications_social: { status: 'REAL', note: 'Novo seguidor e nova resposta geram notificações reais.' },
  reports_posts_players: { status: 'REAL', note: 'Denunciar publicações e perfis; chega ao painel de admin.' },
  reports_other_targets: { status: 'PREPARED', note: 'A base de dados aceita equipas/comentários/mensagens; falta o botão na interface.' },
  achievements_display: { status: 'PARTIAL', note: 'O perfil mostra as conquistas existentes; ainda não há gatilhos automáticos que as atribuam.' },
  scrim_room_privacy: {
    status: 'PARTIAL',
    note: 'ATENÇÃO: código e senha das salas (scrims e partidas) ainda são legíveis por qualquer utilizador autenticado. Correção prioritária.'
  }
}
