'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Button } from '@/components/ui'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw signInError
      }

      const user = data?.user
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError) {
          throw profileError
        }

        if (!profile) {
          const username = (user.user_metadata as any)?.username || ''
          if (!username) {
            throw new Error('Não foi possível recuperar o nome de usuário de registro.')
          }

          const { error: profileInsertError } = await supabase.from('users').insert({
            id: user.id,
            email: user.email || email,
            username,
          } as any)
          if (profileInsertError) {
            throw profileInsertError
          }

          const { error: statsError } = await supabase.from('user_stats').insert({
            user_id: user.id,
          } as any)
          if (statsError) {
            throw statsError
          }
        }
      }

      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/dashboard'
      }
    }
    checkSession()
  }, [])

  return (
    <main className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-bga-dark to-bga-darker p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-bga-accent mb-2">UNO</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500 p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
          >
            Sign In
          </Button>
        </form>

        {/* Links */}
        <div className="space-y-2 text-center text-sm">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-bga-accent hover:underline">
              Create one
            </Link>
          </p>
          <Link href="/" className="text-bga-accent hover:underline block">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
