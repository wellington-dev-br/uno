# 🎮 UNO Online - Project Tasks & Roadmap

## 📋 Visão Geral do Projeto

**Objetivo**: Criar uma plataforma multiplayer de Uno online idêntica ao Board Game Arena (BGA)  
**Stack**: Vercel (Next.js) + Supabase + GitHub  
**Requitos de escala inicial**: 10 jogadores simultâneos  
**Autenticação**: Email/Senha  
**Modos de jogo**: Casual e Ranked (ELO)  
**Data de início**: 9 de Abril de 2026

---

## 🏗️ Arquitetura do Projeto

### Frontend (Vercel/Next.js)
```
/app
├── /auth (login, register, password reset)
├── /dashboard (home, amigos, convites pendentes)
├── /game (sala de espera, tabuleiro, histórico)
├── /profile (perfil, estatísticas, conquistas)
├── /ranking (leaderboard global/amigos)
└── /settings (preferências, notificações)

/components
├── /game (CardHand, Board, PlayerInfo, ChatBox)
├── /ui (Button, Modal, Badge, Card, Notification)
└── /realtime (FriendsList, InviteNotification, StatusBar)

/lib
├── supabase.ts (client Supabase)
├── gameLogic.ts (validações de jogadas)
├── constants.ts (cores, números, timeout)
└── types.ts (interfaces TypeScript)

/styles
└── globals.css (Tailwind + customizações BGA style)
```

### Backend (Supabase)

#### 📊 Tabelas PostgreSQL
```sql
-- Autenticação (gerenciada pelo Supabase Auth)
auth.users (id, email, created_at)

-- Usuários
public.users (
  id, email, username, avatar_url, 
  elo_rank, casual_points, level, 
  joined_at, updated_at
)

-- Partidas
public.games (
  id, host_id, status (waiting/playing/finished),
  game_type (casual/ranked), max_players,
  current_turn, round_number,
  created_at, started_at, finished_at
)

-- Jogadores em Partida
public.game_players (
  id, game_id, user_id, position,
  hand_cards (JSON), score, is_alive,
  joined_at
)

-- Histórico de Jogadas
public.game_moves (
  id, game_id, player_id, move_type,
  card_played, color_chosen, timestamp
)

-- Sistema de Ranking/Pontuação
public.user_stats (
  id, user_id, total_games, wins, losses,
  elo_rating, casual_points, rank_position,
  last_updated
)

-- Conquistas
public.achievements (
  id, name, description, icon, 
  criteria (JSON), points
)

public.user_achievements (
  id, user_id, achievement_id, 
  unlocked_at
)

-- Amigos
public.friendships (
  id, user_a_id, user_b_id, 
  status (pending/accepted/blocked),
  created_at
)

-- Convites de Jogo
public.game_invites (
  id, game_id, from_user_id, to_user_id,
  status (pending/accepted/declined),
  created_at, expires_at
)

-- Status em Tempo Real
public.user_presence (
  id, user_id, status (online/offline/playing/waiting),
  game_id, last_seen, updated_at
)
```

#### 🔄 Supabase Realtime Channels
```
- presence:friends (status de amigos)
- game:{gameId}:moves (jogadas em tempo real)
- game:{gameId}:players (entrada/saída de jogadores)
- notifications:{userId} (convites, mensagens)
```

### Edge Functions (Vercel/Supabase)

```
/functions
├── create-game - Cria nova partida
├── join-game - Entra em partida aguardando
├── leave-game - Sai da partida
├── play-move - Processa jogada
├── draw-card - Pega carta da baralho
├── skip-turn - Pula turno
├── uno-call - Grita UNO
├── validate-move - Valida se jugada é legal
├── calculate-elo - Calcula ELO após jogo
├── send-invite - Envia convite
├── check-achievements - Verifica conquistas
└── get-game-state - Retorna estado da partida
```

---

## 📅 Fases de Desenvolvimento

### Phase 1: Setup & Auth (Semana 1)
- [x] Inicializar projeto Next.js com Tailwind
- [x] Configurar Supabase project
- [x] Setup do banco de dados - criar todas tabelas
- [x] Autenticação Supabase (email/senha)
- [x] Página de login/registro
- [x] Middleware de proteção de rotas

**Entregáveis**: Usuários podem se registrar e fazer login

---

### Phase 2: Interface & Amigos (Semana 2)
- [x] Dashboard principal
- [x] Lista de amigos (online/offline realtime)
- [x] Sistema de adição de amigos
- [x] Perfil do usuário
- [x] Navbar com status
- [x] Setup Supabase Realtime

**Entregáveis**: Sistema de amigos funcionando em tempo real

---

### Phase 3: Game Logic & Regras (Semana 2-3)
- [ ] Implementar lógica de Uno (validações)
- [ ] Card hand rendering
- [ ] Game board visual
- [ ] Turn management
- [ ] Draw card logic
- [ ] UNO detection
- [ ] Testes unitários das regras

**Entregáveis**: Lógica completa do jogo validada

---

### Phase 4: Multiplayer Online (Semana 3-4)
- [ ] Edge functions para game actions
- [ ] Websocket realtime para jogadas
- [ ] Criar/entrar em sala de espera
- [ ] Sync de estado entre jogadores
- [ ] Turn-based synchronization
- [ ] Disconnect handling

**Entregáveis**: 2 jogadores podem jogar online

---

### Phase 5: Convites & Matchmaking (Semana 4)
- [ ] Sistema de convites para amigos
- [ ] Notificações realtime de convites
- [ ] Aceitar/recusar convites
- [ ] Matchmaking automático (casual)
- [ ] Ranked queue (ranked)

**Entregáveis**: Convites funcionam, 10 jogadores podem se conectar

---

### Phase 6: Ranking & ELO (Semana 5)
- [ ] Cálculo de ELO após cada jogo
- [ ] Leaderboard global
- [ ] Leaderboard de amigos
- [ ] Histórico de jogos
- [ ] Estatísticas por usuário

**Entregáveis**: Sistema de ranking funcional

---

### Phase 7: Conquistas (Semana 5)
- [ ] Criar tabela de conquistas
- [ ] Implementar 15+ conquistas (vitórias, combos, etc)
- [ ] Sistema de detecção automática
- [ ] Badge visualization
- [ ] Unlock notifications

**Entregáveis**: 15+ conquistas desbloqueáveis

---

### Phase 8: Visual Polish & BGA Style (Semana 6)
- [ ] Estilos das cartas idênticos a BGA
- [ ] Animações de cartas
- [ ] Efeitos visuais de jogadas
- [ ] Chat in-game
- [ ] Notificações elegantes
- [ ] Responsive design mobile

**Entregáveis**: Interface profissional estilo BGA

---

### Phase 9: Testes & Deploy (Semana 6)
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Security audit
- [ ] Deploy em staging Vercel
- [ ] Deploy em produção

**Entregáveis**: App em produção no Vercel

---

## 🛠️ Stack Técnico Detalhe

### Frontend
```
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- Supabase JS Client
- Socket.IO / Supabase Realtime
- SWR ou React Query (caching)
- Zustand (state management)
- Framer Motion (animações)
```

### Backend
```
- Supabase PostgreSQL
- Supabase Realtime (WebSocket)
- Supabase Auth (email/password)
- Supabase Edge Functions (Deno)
- RLS (Row Level Security)
```

### DevOps
```
- GitHub (versionamento)
- Vercel (hosting frontend)
- Supabase (database + backend)
- GitHub Actions (CI/CD)
```

---

## 🎨 Especificações de Design

### Cores (BGA Style)
```
- Fundo: #1a1a2e (dark blue)
- Cartas: Cores padrão UNO (Vermelho, Amarelo, Azul, Verde)
- Texto: #ffffff ou #333333
- Accent: #00d4ff (cyan)
```

### Cartas do Jogo
```
Números: 0-9 (4 de cada cor) = 36 cartas
Ação: Skip, Reverse, Draw2 (2 de cada cor) = 24 cartas
Wild: Wild, Wild Draw4 (4 de cada) = 8 cartas
Total: 108 cartas

Visual: Seguir exatamente o estilo BGA
- Cantos arredondados
- Fonte clara e legível
- Ícones de ação distintos
```

---

## 📊 Funcionalidades Específicas

### 1️⃣ Ranking/ELO
```
- Inicial: 1200 ELO
- Win: +16 a +40 (baseado em rating do oponente)
- Loss: -16 a -40
- Placement: Top 100 global
- Atualização: Real-time no profile
```

### 2️⃣ Conquistas Sugeridas
```
✓ Primeira Vitória
✓ 10 Vitórias
✓ 100 Vitórias
✓ Streak de 5 vitórias
✓ Ganhar com 1 carta
✓ Usar 3 Wild Draw4 numa partida
✓ Ganhar modo ranked
✓ Top 50 na ladder
✓ Convizar 10 amigos
✓ Jogo com 10 jogadores
✓ Vitória em menos de 5 minutos
✓ Draw contra um jogador específico
✓ Legendary (1000 ELO+)
✓ Social (50 amigos)
✓ Collector (desbloquear todas conquistas)
```

### 3️⃣ Status em Tempo Real
```
Estados: online, offline, playing (game_id), waiting (game_id)
Atualização: WebSocket Supabase
Visibilidade: Amigos veem status
Histórico: Last seen timestamp
```

---

## 🔐 Segurança

- [ ] RLS policies em todas tabelas
- [ ] Validação server-side de todas jogadas
- [ ] JWT tokens via Supabase Auth
- [ ] HTTPS only
- [ ] Rate limiting em APIs
- [ ] SSL certificate
- [ ] CORS configurado corretamente

---

## 📱 Device Support

- [x] Desktop (Chrome, Firefox, Safari, Edge)
- [x] Tablet (iPad, Android tablets)
- [x] Mobile (iOS iPhone, Android)

---

## 📈 KPIs de Sucesso

- [ ] 10+ jogadores online simultaneamente
- [ ] <100ms latência nas jogadas
- [ ] 99.9% uptime
- [ ] <2 segundo match-making time
- [ ] Notificações entregues em <1 segundo

---

## 📝 Notas Importantes

1. **Game Logic**: Todas validações no servidor (Edge Functions)
2. **State Management**: Usar Zustand para estado local, Supabase Realtime para sync
3. **Real-time**: Supabase Realtime em vez de Socket.IO (mais simples, integrado)
4. **Mobile**: Responsive design obrigatório
5. **Performance**: Lazy load, code splitting, image optimization
6. **Testing**: Unit tests para game logic, integration tests para APIs

---

## 🚀 Próximos Passos

1. ✅ Criar estrutura de pastas
2. ✅ Initializar Next.js + Supabase
3. ✅ Configurar banco de dados
4. ✅ Setup autenticação
5. 🔄 Começar Phase 1 (Setup & Auth)

---

**Status Atual**: 📋 Planejamento Completo  
**Próxima Ação**: Criar estrutura do projeto e inicializar repositório
