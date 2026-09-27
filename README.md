# FF TEAM HUB

**Find your squad. Build your legacy.**

Plataforma independente para a comunidade competitiva de Free Fire — Moçambique first, arquitetada para África.

> **Não é um produto oficial da Garena.** Sem afiliação oficial.

## Funcionalidades (MVP completo)

| Módulo | Funcionalidades |
|--------|-----------------|
| **Auth** | Login, registo, sessão, onboarding, logout |
| **Players** | Perfis competitivos, funções, disponibilidade |
| **Teams** | Criar, explorar, lineup, capitão protegido |
| **Tryouts** | Publicar, filtrar, candidatar, notificações |
| **Scrims** | Criar, inscrever Teams, sala (código/senha) |
| **Torneios** | Criar, inscrições, matches, resultados, classificação |
| **Scoring** | points_per_kill + placement_points configuráveis |
| **Rankings** | Players + Teams por temporada (estrutura pronta) |
| **Feed** | Posts, likes, eliminar próprio post |
| **Chat** | DM player↔player, Realtime |
| **Notificações** | Centralizadas, marcar lidas |
| **Reports** | Denúncias + moderação |
| **Admin** | Métricas, users, suspend/ban, roles, reports |
| **PWA** | Manifest + service worker |

## Stack

- React 18 + Vite 5 + TypeScript
- Tailwind CSS (dark mode)
- Supabase (Auth, PostgreSQL, Storage, Realtime)
- React Router 6
- vite-plugin-pwa

## Instalação rápida

```bash
cd ff-team-hub
cp .env.example .env
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
npm install
npm run dev
```

## Supabase — setup

1. Cria projeto em supabase.com
2. Copia URL + anon key para `.env`
3. Authentication → Providers → Email ON
4. URL Configuration → adiciona `http://localhost:5173`
5. Corre **todas** as migrations por ordem no SQL Editor:

```
0001_init_profiles.sql
0002_teams.sql
0003_tryouts_applications.sql
0004_storage.sql
0005_scrims.sql
0006_tournaments.sql
0007_feed_messaging.sql
0008_rankings_reports_admin.sql
```

Ou com CLI:

```bash
supabase db push
```

### Primeiro admin

```sql
update profiles set role = 'admin' where id = '<user-id>';
```

### Promover organizador

```sql
update profiles set role = 'organizer' where id = '<user-id>';
```

Capitães também podem criar torneios (policy atualizada).

## Rotas

```
/                    Splash
/login /register     Auth
/onboarding          Onboarding
/home                Dashboard
/explore /tryouts    Tryouts
/teams /teams/:id    Teams
/scrims /scrims/:id  Scrims
/tournaments         Torneios
/feed                Feed comunitário
/messages /messages/:id  Chat
/notifications
/rankings
/profile
/admin /admin/users /admin/reports
```

## Ciclo competitivo

```
PLAYER → TEAM → TRYOUT → SCRIM → TOURNAMENT → RESULT → RANKING
```

## Segurança

- RLS em todas as tabelas
- Passwords só via Supabase Auth
- Capitão não removível sem promoção
- Código/senha de sala só para participantes
- Admin/moderator gates no frontend **e** no SQL

## Scripts

| Comando | |
|---------|--|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build produção |
| `npm run preview` | Preview |
| `npm run test` | Vitest |

## PWA

Ícones em `public/icons/` (`icon-192.png`, `icon-512.png`). A app é instalável no Android após build.

## Deploy

Build estático → Vercel / Netlify / Cloudflare Pages.  
Define `VITE_SUPABASE_*` no host. **Nunca** exponhas a service_role key.

## Notas

- Estatísticas são **da plataforma**, não da Garena
- Dados demo são fictícios
- Sem integrações oficiais com servidores Free Fire
- Preparado para Capacitor (mobile pack) e expansão multi-país

---

**FF TEAM HUB** — Find your squad. Build your legacy.

## Gerar o APK Android (Capacitor)

O projeto já tem o Capacitor configurado (`capacitor.config.ts`, dependências no `package.json`). Falta só adicionar a plataforma Android — isso precisa de internet e do Android SDK, por isso corre estes passos na tua máquina, não neste ambiente sandbox.

### Pré-requisitos
- Node.js e npm instalados
- [Android Studio](https://developer.android.com/studio) instalado (inclui o Android SDK e o Gradle)

### Passos

```bash
npm install
cp .env.example .env   # preenche com URL + anon key do Supabase
npx cap add android    # cria a pasta android/ (só precisa de correr uma vez)
npm run cap:sync       # faz o build web e copia para o projeto Android
```

**Opção A — via Android Studio (mais simples):**

```bash
npm run android:open
```

Isto abre o Android Studio. Espera o Gradle sincronizar e usa **Build → Build Bundle(s) / APK(s) → Build APK(s)**. O ficheiro `.apk` fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

**Opção B — via linha de comandos:**

```bash
npm run android:build-debug
```

Gera um APK de debug (não assinado para produção, mas instalável para testes) em `android/app/build/outputs/apk/debug/app-debug.apk`. Transfere esse ficheiro para o telemóvel e instala (pode ser preciso ativar "Instalar de fontes desconhecidas" nas definições do Android).

### Para publicar na Play Store

Um APK/AAB de produção precisa de ser assinado com uma keystore própria:

```bash
keytool -genkey -v -keystore ff-team-hub.keystore -alias ffteamhub -keyalg RSA -keysize 2048 -validity 10000
```

Configura essa keystore em `android/app/build.gradle` (secção `signingConfigs`) e depois:

```bash
npm run android:build-release
```

### Ícone e splash screen

Substitui os ficheiros em `public/icons/` (`icon-192.png`, `icon-512.png`) pelo logótipo real do FF TEAM HUB antes de gerar o APK final — o Capacitor usa-os para o ícone da app. Para gerar todos os tamanhos de ícone Android automaticamente a partir de uma única imagem, usa `npx @capacitor/assets generate`.

## Gerar o APK sem instalar nada (GitHub Actions) — caminho mais fácil

Não precisas de Android Studio nem de nada instalado no teu computador. O GitHub constrói o APK por ti.

### 1. Cria uma conta no GitHub
Se ainda não tiveres: [github.com/signup](https://github.com/signup) (gratuito).

### 2. Cria um repositório novo
No GitHub, clica em **New repository**. Dá o nome `ff-team-hub`, marca como **Private** (privado) se quiseres, e clica em **Create repository**.

### 3. Envia este projeto para o repositório
Na página do repositório vazio, o GitHub mostra um botão **"uploading an existing file"** — usa-o para arrastar todos os ficheiros e pastas deste projeto (incluindo pastas ocultas como `.github`). Se preferires linha de comandos:

```bash
git init
git add .
git commit -m "FF TEAM HUB"
git branch -M main
git remote add origin https://github.com/<o-teu-utilizador>/ff-team-hub.git
git push -u origin main
```

O ficheiro `.env` já vem preenchido com as credenciais do teu projeto Supabase — não precisas de configurar nada mais antes de continuar. (A `anon key` do Supabase é segura de ficar visível; a chave verdadeiramente secreta, `service_role`, nunca está neste projeto.)

### 4. Deixa o GitHub construir o APK
Assim que fizeres o push (passo 3), o GitHub já começa a construir automaticamente. Para acompanhar: separador **Actions** no topo do repositório → clica na build mais recente ("Build Android APK") → espera o ícone verde ✅ (demora uns 5-10 minutos).

Se não correr automaticamente: separador **Actions** → **Build Android APK** → botão **Run workflow**.

### 5. Descarrega o APK
Na página da build concluída, em baixo, na secção **Artifacts**, aparece `ff-team-hub-debug-apk` — clica para descarregar um `.zip` que contém o `app-debug.apk`. Transfere esse ficheiro para o telemóvel Android e instala (pode ser preciso ativar "Instalar de fontes desconhecidas" nas definições).

Este é um APK de **debug**, ótimo para testar. Para publicares na Play Store mais tarde, precisas de uma versão assinada — ver a secção "Para publicar na Play Store" acima.
