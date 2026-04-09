# 🎮 UNO Online - Multiplayer Card Game Platform

A full-featured Uno multiplayer game platform inspired by Board Game Arena, built with modern web technologies.

## 🎯 Features

- **Multiplayer Gameplay** - Play with 2-10 players in real-time
- **Two Game Modes**:
  - Casual: Play for fun with friends
  - Ranked: Compete for ELO rating and rankings
- **Real-time Features**:
  - Live friend status (online/offline/playing)
  - Instant game invites and notifications
  - Real-time card animations and moves
- **Progression System**:
  - ELO-based ranking
  - Player rankings and leaderboards
  - 15+ unlock able achievements
  - Player levels and points
- **Social Features**:
  - Friend list management
  - Game history and statistics
  - Player profiles
  - In-game chat

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 14 (React 18, TypeScript)
- Tailwind CSS
- Supabase JS Client
- Framer Motion
- Zustand

**Backend**
- Supabase PostgreSQL
- Supabase Realtime
- Supabase Auth
- Edge Functions

**Deployment**
- Vercel (Frontend hosting)
- Supabase (Backend & Database)
- GitHub (Version control)

### Project Structure

```
uno/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes (login, register)
│   ├── dashboard/         # Main dashboard
│   ├── game/              # Game pages
│   ├── profile/           # User profile
│   ├── ranking/           # Leaderboards
│   └── settings/          # User settings
├── components/            # React components
│   ├── game/              # Game-specific components
│   ├── ui/                # Reusable UI components
│   └── realtime/          # Realtime components
├── lib/                   # Utility functions
├── public/                # Static assets
├── supabase/              # Database migrations & functions
└── styles/                # CSS files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Uno.git
   cd Uno
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```

4. **Setup Supabase**
   ```bash
   npm run supabase:link
   npm run supabase:push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📚 Development

### Database Management

```bash
# Push migrations to Supabase
npm run supabase:push

# Pull latest schema from Supabase
npm run supabase:pull

# Generate TypeScript types from database
npm run supabase:gen-types
```

### Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📋 Project Phases

See [TASKS.md](TASKS.md) for detailed development roadmap and task tracking.

### Current Phase: Setup & Auth

## 🎮 Game Rules

UNO follows standard rules:
- Players must play a card matching the color or number of the top card
- Wild cards can be played anytime
- Skip, Reverse, and Draw2 cards have special effects
- First player to empty their hand wins
- Points are calculated from cards in other players' hands

## 🏆 Ranking System

- **Initial Rating**: 1200 ELO
- **Win**: +16 to +40 points
- **Loss**: -16 to -40 points
- **Ranked Queue**: Automatic matchmaking
- **Leaderboard**: Global rankings updated in real-time

## 🎖️ Achievements

- First Blood (First win)
- Victory (10 wins)
- Legend (100 wins)
- On Fire (5-win streak)
- And 10+ more...

## 🔐 Security

- Email/password authentication via Supabase Auth
- Row-level security policies on all database tables
- Server-side validation of all game moves
- JWT token-based authorization
- HTTPS only

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📧 Support

For issues and questions, please open a GitHub issue.

## 🙏 Credits

- Inspired by [Board Game Arena](https://boardgamearena.com/)
- UNO is a trademark of Mattel, Inc.

---

**Version**: 0.1.0  
**Status**: In Development  
**Last Updated**: April 9, 2026
