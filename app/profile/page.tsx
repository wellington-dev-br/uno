'use client'

import { useEffect, useState } from 'react'
import { supabase, getUserAchievements, getUserGameHistory } from '@/lib/supabase'
import { Achievement, User, UserStats } from '@/lib/types'
import { Button } from '@/components/ui'

export default function ProfilePage() {
  const [profile, setProfile] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = '/auth/login'
          return
        }

        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData)

        const { data: statsData } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setStats(statsData)

        const achievementData = await getUserAchievements(user.id)
        setAchievements(achievementData.map((item) => item.achievement))

        const historyData = await getUserGameHistory(user.id)
        setHistory(historyData)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bga-dark">
        <div className="text-center text-gray-300">Carregando perfil...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-bga-dark text-white">
      <section className="border-b border-gray-700 bg-bga-darker p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-bga-accent">Meu Perfil</h1>
          <p className="mt-2 text-gray-400">Veja seu progresso, estatísticas e informações de conta.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-gray-500">Usuário</p>
            <p className="mt-2 text-3xl font-semibold text-white">{profile?.username}</p>
            <p className="mt-3 text-gray-400">{profile?.email}</p>
          </div>

          <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-gray-500">ELO</p>
            <p className="mt-2 text-3xl font-semibold text-bga-accent">{profile?.elo_rank}</p>
            <p className="mt-3 text-gray-400">Nível {profile?.level}</p>
          </div>

          <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-gray-500">Pontos Casuais</p>
            <p className="mt-2 text-3xl font-semibold text-yellow-400">{profile?.casual_points}</p>
            <p className="mt-3 text-gray-400">Jogado desde {new Date(profile?.joined_at ?? '').toLocaleDateString()}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
          <h2 className="text-2xl font-semibold text-white">Estatísticas</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-bga-dark p-4">
              <p className="text-sm text-gray-400">Partidas</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats?.total_games ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-bga-dark p-4">
              <p className="text-sm text-gray-400">Vitórias</p>
              <p className="mt-2 text-2xl font-semibold text-green-400">{stats?.wins ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-bga-dark p-4">
              <p className="text-sm text-gray-400">Derrotas</p>
              <p className="mt-2 text-2xl font-semibold text-red-400">{stats?.losses ?? 0}</p>
            </div>
            <div className="rounded-2xl bg-bga-dark p-4">
              <p className="text-sm text-gray-400">Rank Global</p>
              <p className="mt-2 text-2xl font-semibold text-bga-accent">{stats?.rank_position ?? '-'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
          <h2 className="text-2xl font-semibold text-white">Conquistas</h2>
          <p className="mt-2 text-gray-400">Veja as suas conquistas desbloqueadas e acompanhe seu progresso.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {achievements.length === 0 ? (
              <div className="rounded-2xl bg-bga-dark p-4 text-gray-400">Nenhuma conquista desbloqueada ainda.</div>
            ) : (
              achievements.slice(0, 8).map((achievement) => (
                <div key={achievement.id} className="rounded-2xl bg-bga-dark p-4">
                  <p className="text-xl">{achievement.icon || '🏅'}</p>
                  <p className="mt-3 font-semibold text-white">{achievement.name}</p>
                  <p className="mt-1 text-sm text-gray-400">{achievement.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
          <h2 className="text-2xl font-semibold text-white">Histórico de partidas</h2>
          <div className="mt-4 space-y-3 text-gray-100">
            {history.length === 0 ? (
              <p className="text-gray-400">Ainda não há histórico de partidas concluídas.</p>
            ) : (
              history.slice(0, 6).map((game, index) => (
                <div key={index} className="rounded-2xl bg-bga-dark p-4">
                  <p className="font-semibold text-white">{game.game_type === 'ranked' ? 'Ranked' : 'Casual'} · {game.status}</p>
                  <p className="text-sm text-gray-400">Criada em {game.created_at ? new Date(game.created_at).toLocaleDateString() : '—'}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
          <h2 className="text-2xl font-semibold text-white">Sobre você</h2>
          <p className="mt-3 text-gray-400">
            Aqui você pode ver seu perfil e acompanhar progresso na plataforma. Em breve adicionaremos edição de perfil e conquistas.
          </p>
          <Button onClick={() => window.location.href = '/dashboard'} className="mt-6">
            Voltar ao dashboard
          </Button>
        </div>
      </section>
    </main>
  )
}
