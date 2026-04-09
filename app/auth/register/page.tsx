'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/database.types'
import Link from 'next/link'
import { Button } from '@/components/ui'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (!username.trim()) {
      setError('Username is required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || 'Falha ao criar usuário')
      }

      setSuccess(true)
      setInfo('Cadastro concluído! Agora faça login com email e senha.')
      setTimeout(() => {
        window.location.href = '/auth/login'
      }, 2000)
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
          <p className="text-gray-400">Create your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500 p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          {info && (
            <div className="rounded-lg bg-green-500/10 border border-green-500 p-3 text-green-500 text-sm">
              {info}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              className="input"
              required
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
              disabled={loading || success}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
            disabled={loading || success}
          >
            Create Account
          </Button>
        </form>

        {/* Links */}
        <div className="space-y-2 text-center text-sm">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-bga-accent hover:underline">
              Sign in
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
