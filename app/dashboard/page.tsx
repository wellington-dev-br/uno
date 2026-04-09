'use client'

import { useEffect, useState } from 'react'
import { supabase, getFriends, sendFriendRequest, setUserPresence, subscribeToUserPresence, quickMatch, getPendingGameInvites, respondGameInvite } from '@/lib/supabase'
import { User } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [friends, setFriends] = useState<any[]>([])
  const [friendStatuses, setFriendStatuses] = useState<Record<string, string>>({})
  const [invites, setInvites] = useState<any[]>([])
  const [friendUsername, setFriendUsername] = useState('')
  const [friendStatus, setFriendStatus] = useState<string | null>(null)
  const [inviteStatus, setInviteStatus] = useState<string | null>(null)
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

    const loadInvites = async () => {
      try {
        const inviteData = await getPendingGameInvites(user.id)
        setInvites(inviteData)
      } catch (error) {
        console.error('Error loading invites:', error)
      }
    }

    const initPresence = async () => {
      try {
        await setUserPresence('online', null)
      } catch (error) {
        console.error('Error setting presence:', error)
      }
    }

    let subscription: any = null

    subscribeToUserPresence((payload) => {
      const record = payload.new || payload.record || payload
      if (record?.user_id) {
        setFriendStatuses((prev) => ({
          ...prev,
          [record.user_id]: record.status,
        }))
      }
    }).then((sub) => {
      subscription = sub
    }).catch((error) => {
      console.error('Error subscribing to presence:', error)
    })

    loadFriends()
    loadInvites()
    initPresence()

    return () => {
      subscription?.unsubscribe()
    }
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

  const handleQuickMatch = async () => {
    setLoading(true)
    setInviteStatus(null)

    try {
      const game = await quickMatch()
      setInviteStatus('Match encontrado! Redirecionando...')
      window.location.href = `/game/${game.id}`
    } catch (error) {
      setInviteStatus(error instanceof Error ? error.message : 'Erro ao encontrar partida.')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteResponse = async (inviteId: string, accept: boolean) => {
    setLoading(true)
    setInviteStatus(null)

    try {
      await respondGameInvite(inviteId, accept)
      setInviteStatus(accept ? 'Convite aceito!' : 'Convite recusado.')
      if (user) {
        const inviteData = await getPendingGameInvites(user.id)
        setInvites(inviteData)
      }
    } catch (error) {
      setInviteStatus(error instanceof Error ? error.message : 'Erro ao responder o convite.')
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-bga-accent">UNO</h1>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">Online</span>
            </div>
            <div className="flex flex-wrap gap-4">
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

            <div className="rounded-lg bg-bga-darker border border-gray-600 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Matchmaking & convites</h3>
                <span className="text-sm text-gray-400">Rápido e social</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Button onClick={handleQuickMatch} loading={loading} className="w-full">
                  Encontrar partida casual
                </Button>
                <Button onClick={() => window.location.href = '/game'} variant="secondary" className="w-full">
                  Iniciar sala manual
                </Button>
              </div>
              <div className="mt-6">
                <h4 className="text-sm uppercase tracking-[0.24em] text-gray-500">Convites pendentes</h4>
                {invites.length === 0 ? (
                  <p className="mt-3 text-gray-400">Nenhum convite pendente.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {invites.map((invite) => (
                      <div key={invite.id} className="rounded-2xl bg-bga-dark p-4">
                        <p className="font-semibold text-white">{invite.from_user?.username || invite.from_user_id}</p>
                        <p className="text-sm text-gray-400">Partida: {invite.game?.id || '—'}</p>
                        <div className="mt-3 flex gap-2">
                          <Button onClick={() => handleInviteResponse(invite.id, true)} loading={loading} className="flex-1">
                            Aceitar
                          </Button>
                          <Button onClick={() => handleInviteResponse(invite.id, false)} variant="secondary" className="flex-1">
                            Recusar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {inviteStatus && <p className="mt-3 text-sm text-gray-300">{inviteStatus}</p>}
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
                    const status = friendStatuses[friendUser?.id] || 'offline'
                    return (
                      <div key={friend.id} className="rounded-2xl bg-bga-dark p-4 text-gray-200">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-semibold">{friendUser?.username}</p>
                          <span className={`text-sm ${status === 'online' ? 'text-emerald-400' : status === 'playing' ? 'text-cyan-400' : 'text-gray-400'}`}>
                            {status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">Amigo</p>
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
