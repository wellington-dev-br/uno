'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Input } from '@/components/ui'
import { User, Game } from '@/lib/types'
import { createGame, getAvailableGames, getCurrentUserProfile, joinGame } from '@/lib/supabase'

export default function GamePage() {
  const [user, setUser] = useState<User | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [joinId, setJoinId] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUser()
    loadGames()
  }, [])

  const loadUser = async () => {
    const currentUser = await getCurrentUserProfile()
    setUser(currentUser)
  }

  const loadGames = async () => {
    const { games: waitingGames } = await getAvailableGames()
    setGames(waitingGames)
  }

  const handleCreateGame = async (gameType: 'casual' | 'ranked') => {
    setLoading(true)
    setMessage(null)

    try {
      await createGame(gameType, 4)
      setMessage(`Partida ${gameType} criada com sucesso!`)
      setJoinId('')
      await loadGames()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao criar a partida.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGame = async () => {
    if (!joinId) {
      setMessage('Informe o código da partida.')
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      await joinGame(joinId)
      setMessage('Você entrou na partida com sucesso!')
      setJoinId('')
      await loadGames()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao entrar na partida.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-bga-dark text-white">
      <section className="border-b border-gray-700 bg-bga-darker p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-bga-accent">Sala de Jogo</h1>
            <p className="mt-2 text-gray-400 max-w-2xl">
              Crie uma partida casual ou ranked e convide amigos. Você também pode entrar em uma partida aguardando usando o código.
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-300 hover:text-bga-accent">
            Voltar ao dashboard
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
            <h2 className="text-2xl font-semibold text-white">Criar nova partida</h2>
            <p className="mt-2 text-gray-400">Escolha um modo de jogo e inicie a sala de espera.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button onClick={() => handleCreateGame('casual')} loading={loading} className="w-full">
                Criar Casual
              </Button>
              <Button onClick={() => handleCreateGame('ranked')} variant="secondary" loading={loading} className="w-full">
                Criar Ranked
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
            <h2 className="text-2xl font-semibold text-white">Entrar em partida</h2>
            <p className="mt-2 text-gray-400">Digite o código da partida e junte-se a uma sala disponível.</p>
            <div className="mt-6 space-y-4">
              <Input
                value={joinId}
                onChange={(event) => setJoinId(event.target.value)}
                placeholder="ID da partida"
              />
              <Button onClick={handleJoinGame} disabled={loading} className="w-full">
                Entrar na partida
              </Button>
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-gray-700 bg-bga-darker p-4 text-sm text-gray-200">
            {message}
          </div>
        )}

        <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Partidas aguardando</h2>
            <Button variant="ghost" onClick={loadGames} className="text-sm">
              Atualizar
            </Button>
          </div>

          <div className="mt-6 space-y-4">
            {games.length === 0 ? (
              <p className="text-gray-400">Nenhuma partida disponível no momento. Crie uma nova partida ou tente novamente mais tarde.</p>
            ) : (
              games.map((game) => (
                <div key={game.id} className="rounded-2xl border border-gray-700 bg-bga-dark p-4 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{game.game_type === 'ranked' ? 'Ranked' : 'Casual'}</p>
                    <p className="text-lg font-semibold text-white">ID: {game.id}</p>
                    <p className="text-sm text-gray-400">Criada em {new Date(game.created_at).toLocaleString()}</p>
                  </div>
                  <Button onClick={() => { setJoinId(game.id); setMessage(null) }} variant="secondary" className="mt-4 sm:mt-0">
                    Selecionar para entrar
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {user && (
          <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
            <h2 className="text-2xl font-semibold text-white">Olá, {user.username}</h2>
            <p className="mt-2 text-gray-400">Use essa tela para criar partidas rápidas ou entrar em salas já abertas.</p>
          </div>
        )}
      </section>
    </main>
  )
}
