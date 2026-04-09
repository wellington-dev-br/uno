'use client'

import { useEffect, useState } from 'react'
import { supabase, getFriends, sendFriendRequest } from '@/lib/supabase'
import { User } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [friends, setFriends] = useState<any[]>([])
  const [friendUsername, setFriendUsername] = useState('')
  const [friendStatus, setFriendStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          window.location.href = '/auth/login'
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        setUser(userData)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (!user) return

    const loadFriends = async () => {
      try {
        const friendData = await getFriends(user.id)
        setFriends(friendData)
      } catch (error) {
        console.error('Error loading friends:', error)
      }
    }

    loadFriends()
  }, [user])

  const handleSendFriendRequest = async () => {
    if (!friendUsername.trim()) {
      setFriendStatus('Digite o nome de usuário do amigo.')
      return
    }

    setFriendStatus(null)
    setLoading(true)

    try {
      await sendFriendRequest(friendUsername.trim())
      setFriendStatus(`Solicitação enviada para ${friendUsername.trim()}!`)
      setFriendUsername('')

      if (user) {
        const friendData = await getFriends(user.id)
        setFriends(friendData)
      }
    } catch (error) {
      setFriendStatus(error instanceof Error ? error.message : 'Erro ao enviar solicitação.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bga-dark">
        <div className="text-center">
          <div className="animate-spin mb-4 h-12 w-12 border-4 border-bga-accent border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-bga-dark">
      {/* Navbar */}
      <nav className="bg-bga-darker border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-bga-accent">UNO</h1>
            <div className="flex gap-4">
              <Link href="/dashboard" className="text-gray-300 hover:text-bga-accent">
                Dashboard
              </Link>
              <Link href="/ranking" className="text-gray-300 hover:text-bga-accent">
                Ranking
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-bga-accent">
                Profile
              </Link>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-300 hover:text-bga-accent transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {user && (
          <div className="space-y-8">
            {/* Welcome */}
            <div className="rounded-lg bg-bga-darker border border-gray-600 p-8">
              <h2 className="text-3xl font-bold mb-2">Welcome, {user.username}!</h2>
              <p className="text-gray-400">
                You're ready to play. Find a game or challenge your friends.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-bga-darker border border-gray-600 p-6">
                <p className="text-gray-400 text-sm mb-2">ELO Rating</p>
                <p className="text-3xl font-bold text-bga-accent">{user.elo_rank}</p>
              </div>
              <div className="rounded-lg bg-bga-darker border border-gray-600 p-6">
                <p className="text-gray-400 text-sm mb-2">Level</p>
                <p className="text-3xl font-bold text-green-400">{user.level}</p>
              </div>
              <div className="rounded-lg bg-bga-darker border border-gray-600 p-6">
                <p className="text-gray-400 text-sm mb-2">Casual Points</p>
                <p className="text-3xl font-bold text-yellow-400">{user.casual_points}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Get Started</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/game" className="block">
                  <Button variant="primary" className="w-full">
                    Find Random Game
                  </Button>
                </Link>
                <Link href="/game?type=casual" className="block">
                  <Button variant="secondary" className="w-full">
                    Create Casual Game
                  </Button>
                </Link>
              </div>
            </div>

            {/* Friends */}
            <div className="rounded-lg bg-bga-darker border border-gray-600 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Amigos</h3>
                <span className="text-sm text-gray-400">{friends.length} conectados</span>
              </div>
              <div className="mt-4 space-y-3">
                {friends.length === 0 ? (
                  <p className="text-gray-400">Nenhum amigo conectado ainda. Envie um convite para começar a jogar com amigos.</p>
                ) : (
                  friends.map((friend) => {
                    const friendUser = friend.user_a?.id === user?.id ? friend.user_b : friend.user_a
                    return (
                      <div key={friend.id} className="rounded-2xl bg-bga-dark p-4 text-gray-200">
                        <p className="font-semibold">{friendUser?.username}</p>
                        <p className="text-sm text-gray-400">Conectado</p>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="mt-6 rounded-2xl bg-bga-dark p-4">
                <p className="text-sm text-gray-400">Enviar solicitação de amizade</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={friendUsername}
                    onChange={(event) => setFriendUsername(event.target.value)}
                    placeholder="Nome de usuário"
                    className="input w-full"
                  />
                  <Button onClick={handleSendFriendRequest} loading={loading} className="w-full sm:w-auto">
                    Enviar
                  </Button>
                </div>
                {friendStatus && (
                  <p className="mt-3 text-sm text-gray-300">{friendStatus}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
