'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) setMessage(error.message)
      else window.location.href = '/'
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          emailRedirectTo:'${window.location.origin}/auth/callback'
        },
      })
      if (error) setMessage(error.message)
      else setMessage('Check your email for confirmation link!')
    } catch (error) {
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-slate-800 rounded-xl">
      <h1 className="text-2xl font-bold mb-6">Sign In / Sign Up</h1>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-slate-900 rounded-lg"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 bg-slate-900 rounded-lg"
          required
        />
        <div className="flex gap-2">
          <button
            onClick={handleEmailLogin}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="flex-1 py-3 bg-green-600 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign Up'}
          </button>
        </div>
      </form>
      {message && <p className="mt-4 p-3 bg-yellow-900/50 rounded">{message}</p>}
      <p className="mt-6 text-center">
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          ← Back to home
        </Link>
      </p>
    </div>
  )
}