'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EmailAuth({ onSuccess, onBack }) {
  const [mode, setMode] = useState('signin'); // 'signin', 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const supabase = createClient();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        // ثبت‌نام جدید
        if (!username.trim()) {
          throw new Error('Username is required');
        }

        // چک کردن یکتا بودن یوزرنیم
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (existingUser) {
          throw new Error('Username already taken');
        }

        // ثبت‌نام در Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username
            }
          }
        });

        if (authError) throw authError;

        // ساخت پروفایل
        const { data: profile } = await supabase
          .from('profiles')
          .insert({
            auth_id: authData.user.id,
            email: email,
            username: username,
            user_type: 'email_only',
            email_verified: false,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        onSuccess({
          ...profile,
          authType: 'email',
          requiresWallet: true
        });

        setMessage('✓ Registration successful! Please check your email for verification.');

      } else {
        // ورود کاربر موجود
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) throw authError;

        // گرفتن پروفایل
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_id', authData.user.id)
          .single();

        onSuccess({
          ...profile,
          authType: 'email',
          requiresWallet: !profile.wallet_connected
        });
      }
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-800/50 rounded-2xl border border-purple-500/20 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white"
        >
          ← Back
        </button>
        <h3 className="text-xl font-bold text-white">
          {mode === 'signup' ? 'Sign Up' : 'Sign In'}
        </h3>
        <button
          onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          {mode === 'signup' ? 'Sign In' : 'Sign Up'}
        </button>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-sm text-slate-400 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Choose a unique username"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              This will be displayed in chat and challenges
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-400 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${
            message.includes('❌') 
              ? 'bg-red-900/30 border border-red-700' 
              : 'bg-green-900/30 border border-green-700'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg font-bold disabled:opacity-50"
        >
          {loading ? 'Processing...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
        </button>

        {mode === 'signin' && (
          <p className="text-center text-sm text-slate-500">
            Forgot password?{' '}
            <button
              type="button"
              onClick={() => {/* اضافه کردن بازیابی رمز */}}
              className="text-blue-400 hover:text-blue-300"
            >
              Reset it here
            </button>
          </p>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-slate-700">
        <p className="text-sm text-slate-500 text-center">
          By continuing, you agree to our{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300">Terms</a>{' '}
          and{' '}
          <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}