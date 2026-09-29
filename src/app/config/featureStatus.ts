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
  players_directory: { status: 'PARTIAL', note: 'Lista de jogadores registados com pesquisa, filtros (função, província) e seguir. Falta rank/experiência e estado online (a app ainda não tem presença em tempo real). Por testar no Supabase.' },
  follows_lists: { status: 'PARTIAL', note: 'Mostra contagens de seguidores/a seguir; ainda sem as listas de pessoas.' },
  follows_teams: { status: 'PREPARED', note: 'Base de dados pronta; falta o botão nas páginas de equipas.' },
  notifications_social: { status: 'REAL', note: 'Novo seguidor e nova resposta geram notificações reais.' },
  reports_posts_players: { status: 'REAL', note: 'Denunciar publicações e perfis; chega ao painel de admin.' },
  reports_other_targets: { status: 'PREPARED', note: 'A base de dados aceita equipas/comentários/mensagens; falta o botão na interface.' },
  achievements_display: { status: 'PARTIAL', note: 'O perfil mostra as conquistas existentes; ainda não há gatilhos automáticos que as atribuam.' },
  scrim_room_privacy: {
    status: 'PARTIAL',
    note: 'Migration 0013 move código/senha das salas para tabelas privadas com RLS (criador, admin e equipas inscritas). Passa a REAL depois de aplicada e testada no Supabase.'
  },
  messaging_rls_fix: {
    status: 'REAL',
    note: 'Migration 0014 corrige uma falha grave: as políticas RLS de mensagens tinham uma referência errada e deixavam qualquer jogador ler/escrever em conversas alheias. Corrigido com função sem recursão de RLS.'
  },
  messaging_inbox: {
    status: 'REAL',
    note: 'Lista de conversas com não lidas, estado online/offline e ordenação por atividade, numa função SQL única (sem N+1).'
  },
  messaging_delivery: {
    status: 'REAL',
    note: 'Envio otimista com client_id único (sem duplicados em retry/duplo toque), estados enviando/enviada/lida/falhou, scroll inteligente e correção do teclado móvel via visualViewport.'
  },
  notifications_bugfix: {
    status: 'REAL',
    note: 'O serviço de notificações interrogava a coluna user_id, que não existe (a tabela usa profile_id) — todas as notificações falhavam sempre. Corrigido; agora também com tempo real e link direto ao conteúdo.'
  },
  feed_infinite_scroll: {
    status: 'REAL',
    note: 'Scroll infinito por IntersectionObserver e banner "Novas publicações ↑" via Realtime, sem interromper a leitura.'
  },
  player_settings_account: {
    status: 'REAL',
    note: 'Nome, bio, UID Free Fire, alterar email/palavra-passe, recuperação de palavra-passe, terminar sessão noutros dispositivos — tudo persistido no Supabase Auth/profiles.'
  },
  player_settings_competitive: {
    status: 'REAL',
    note: 'Região, funções, nível, disponibilidade e "disponibilidade para recrutamento" editáveis e persistidos.'
  },
  player_settings_privacy: {
    status: 'PARTIAL',
    note: 'Quem pode enviar mensagens/comentar é validado no servidor (RLS/triggers). Mostrar UID/estatísticas aplicado no perfil. Mostrar estado online tem efeito a partir de quando a app carrega essa preferência (ainda não é lida no arranque da sessão). "Quem pode ver o perfil" ainda não restringe nada — fica registado mas não é aplicado.'
  },
  player_settings_notifications: {
    status: 'PARTIAL',
    note: 'Mensagens, likes, respostas e novos seguidores podem ser desligados (aplicado nos triggers SQL). Candidaturas, scrims, torneios e updates de equipa ainda não têm essa opção.'
  },
  player_settings_blocking: {
    status: 'REAL',
    note: 'Bloquear impede mensagens novas e em conversas existentes (RLS), nos dois sentidos. Lista de bloqueados com desbloquear.'
  },
  player_settings_appearance_language: {
    status: 'PREPARED',
    note: 'A escolha de tema e idioma fica guardada, mas a app só tem o visual escuro implementado e só tem textos em português — por isso ainda não muda nada visualmente.'
  },
  player_settings_delete_account: {
    status: 'PARTIAL',
    note: 'A anon key não pode apagar contas do Supabase Auth. O pedido suspende a conta de imediato e fica registado para um admin confirmar a eliminação definitiva — não é uma eliminação automática.'
  }
}
