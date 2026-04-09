'use client'

import { useEffect, useState } from 'react'
import { supabase, getLeaderboard, getFriendLeaderboard, getCurrentUserProfile } from '@/lib/supabase'
import { Button } from '@/components/ui'

interface LeaderboardEntry {
  id: string
  username: string
  elo_rank: number
  casual_points: number
  level: number
}

export default function RankingPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
  const [friends, setFriends] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const global = await getLeaderboard(20)
        setLeaders(global)

        const currentUser = await getCurrentUserProfile()
        if (currentUser) {
          const friendBoard = await getFriendLeaderboard(currentUser.id, 10)
          setFriends(friendBoard)
        }
      } catch (error) {
        console.error('Erro ao carregar ranking:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLeaderboard()
  }, [])

  return (
    <main className="min-h-screen bg-bga-dark text-white">
      <section className="border-b border-gray-700 bg-bga-darker p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-bga-accent">Ranking Global</h1>
            <p className="mt-2 text-gray-400">Veja os melhores jogadores por elo e pontos casuais.</p>
          </div>
          <Button onClick={() => window.location.href = '/dashboard'} variant="ghost">
            Voltar ao dashboard
          </Button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6 text-center text-gray-300">
            Carregando jogadores...
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-gray-700 bg-bga-darker">
            <div className="grid grid-cols-[3fr_1fr_1fr_1fr] border-b border-gray-700 bg-bga-dark px-6 py-4 text-sm uppercase tracking-[0.18em] text-gray-400">
              <span>Jogador</span>
              <span className="text-center">ELO</span>
              <span className="text-center">Pontos</span>
              <span className="text-center">Nível</span>
            </div>
            <div>
              {leaders.map((player, index) => (
                <div
                  key={player.id}
                  className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 border-b border-gray-800 px-6 py-4 text-sm text-gray-100 hover:bg-bga-dark/70"
                >
                  <div>
                    <p className="font-semibold text-white">{index + 1}. {player.username}</p>
                  </div>
                  <div className="text-center text-bga-accent">{player.elo_rank}</div>
                  <div className="text-center text-yellow-300">{player.casual_points}</div>
                  <div className="text-center text-green-300">{player.level}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {friends.length > 0 && (
          <div className="mt-10 rounded-3xl border border-gray-700 bg-bga-darker p-6">
            <div className="flex items-center justify-between border-b border-gray-700 pb-4">
              <h2 className="text-2xl font-semibold text-white">Ranking de Amigos</h2>
              <p className="text-sm text-gray-400">Compare-se com seus amigos</p>
            </div>
            <div className="mt-4 overflow-hidden rounded-3xl border border-gray-700 bg-bga-darker">
              <div className="grid grid-cols-[3fr_1fr_1fr_1fr] border-b border-gray-700 bg-bga-dark px-6 py-4 text-sm uppercase tracking-[0.18em] text-gray-400">
                <span>Jogador</span>
                <span className="text-center">ELO</span>
                <span className="text-center">Pontos</span>
                <span className="text-center">Nível</span>
              </div>
              <div>
                {friends.map((player, index) => (
                  <div
                    key={player.id}
                    className="grid grid-cols-[3fr_1fr_1fr_1fr] gap-4 border-b border-gray-800 px-6 py-4 text-sm text-gray-100 hover:bg-bga-dark/70"
                  >
                    <div>
                      <p className="font-semibold text-white">{index + 1}. {player.username}</p>
                    </div>
                    <div className="text-center text-bga-accent">{player.elo_rank}</div>
                    <div className="text-center text-yellow-300">{player.casual_points}</div>
                    <div className="text-center text-green-300">{player.level}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
