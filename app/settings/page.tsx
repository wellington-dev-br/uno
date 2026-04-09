'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/types'
import { Button } from '@/components/ui'

export default function SettingsPage() {
  const [profile, setProfile] = useState<User | null>(null)
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
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bga-dark">
        <div className="text-gray-300">Carregando configurações...</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-bga-dark text-white">
      <section className="border-b border-gray-700 bg-bga-darker p-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-bga-accent">Configurações</h1>
            <p className="mt-2 text-gray-400">Gerencie sua conta e preferências de jogo.</p>
          </div>
          <Button variant="ghost" onClick={() => window.location.href = '/dashboard'}>
            Voltar ao dashboard
          </Button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
          <h2 className="text-2xl font-semibold text-white">Conta</h2>
          <div className="mt-4 space-y-3 text-gray-300">
            <p>
              <span className="font-medium text-white">Usuário:</span> {profile?.username}
            </p>
            <p>
              <span className="font-medium text-white">Email:</span> {profile?.email}
            </p>
            <p>
              <span className="font-medium text-white">Última atualização:</span>{' '}
              {profile?.updated_at ? new Date(profile.updated_at).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
          <h2 className="text-2xl font-semibold text-white">Preferências</h2>
          <p className="mt-3 text-gray-400">Em breve adicionaremos opções de notificações, temas e controle de privacidade.</p>
        </div>

        <div className="rounded-2xl bg-bga-darker border border-gray-700 p-6">
          <Button variant="danger" onClick={handleLogout} className="w-full">
            Sair da conta
          </Button>
        </div>
      </section>
    </main>
  )
}
