'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import WalletSelector from '@/components/Wallet/WalletSelector';
import ChatSlideout from '@/components/Chat/ChatSlideout';
import ChallengeSlideout from '@/components/Challenge/ChallengeSlideout';
import Link from 'next/link';
import useUser from '@/hooks/useUser';

export default function HomePage() {
  const [showChat, setShowChat] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [activeChallenges, setActiveChallenges] = useState(0);
  
  const supabase = createClient();
  const { user, profile, loading: userLoading, isAuthenticated } = useUser();

  // Load unread messages count
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadUnreadCount = async () => {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour
      
      setUnreadMessages(count || 0);
    };

    loadUnreadCount();

    // Real-time for new messages
    const channel = supabase
      .channel('unread_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        setUnreadMessages(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, supabase]);

  // Load active challenges count
  useEffect(() => {
    const loadActiveChallenges = async () => {
      const { count } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'joined', 'active']);
      
      setActiveChallenges(count || 0);
    };

    loadActiveChallenges();

    const channel = supabase
      .channel('active_challenges')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges'
      }, loadActiveChallenges)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading CiBL Wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      {/* Slideout Components */}
      <ChatSlideout 
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
      
      <ChallengeSlideout 
        isOpen={showChallenge}
        onClose={() => setShowChallenge(false)}
      />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-yellow-500 flex items-center justify-center">
                  <span className="font-bold text-lg">C</span>
                </div>
                <h1 className="text-2xl font-bold">CiBL Wallet</h1>
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Chat Notification Button */}
              <button
                onClick={() => setShowChat(true)}
                className="relative p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                aria-label="Open chat"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-500 to-red-500 rounded-full text-xs font-bold flex items-center justify-center animate-pulse">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>

              {/* Challenges Button */}
              <button
                onClick={() => setShowChallenge(true)}
                className="relative p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                aria-label="Open challenges"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">⚔️</span>
                {activeChallenges > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-xs font-bold flex items-center justify-center">
                    {activeChallenges > 9 ? '9+' : activeChallenges}
                  </span>
                )}
              </button>

              {/* User Profile/Connect */}
              {isAuthenticated && profile ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-white">@{profile.username}</p>
                    <p className="text-xs text-slate-400">
                      {profile.user_type === 'wallet_only' 
                        ? `${profile.solana_address?.slice(0, 6)}...${profile.solana_address?.slice(-4)}`
                        : profile.email?.split('@')[0]
                      }
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="font-bold">
                      {profile.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-400">
                  Connect to start trading
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
            Solana Trading Challenges
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Compete in real-time trading duels, chat with the community, 
            and master the markets with CiBL Wallet.
          </p>
        </div>

        {/* Wallet Selector */}
        <div className="mb-12">
          <WalletSelector />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 bg-gradient-to-br from-blue-900/20 to-slate-800/50 rounded-2xl border border-blue-500/20">
            <div className="text-3xl mb-4">👛</div>
            <h3 className="text-xl font-bold text-white mb-3">Wallet First</h3>
            <p className="text-slate-300">
              Create or import your Solana wallet instantly. No email required to start chatting.
            </p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-purple-900/20 to-slate-800/50 rounded-2xl border border-purple-500/20">
            <div className="text-3xl mb-4">⚔️</div>
            <h3 className="text-xl font-bold text-white mb-3">Trading Duels</h3>
            <p className="text-slate-300">
              Challenge other traders. Win based on PnL in timed trading sessions.
            </p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-green-900/20 to-slate-800/50 rounded-2xl border border-green-500/20">
            <div className="text-3xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-white mb-3">Community Chat</h3>
            <p className="text-slate-300">
              Real-time chat with 300-character messages. Discuss strategies and results.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        {isAuthenticated && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            <div className="p-4 bg-slate-800/30 rounded-xl text-center">
              <div className="text-2xl font-bold text-white">{activeChallenges}</div>
              <div className="text-sm text-slate-400">Active Challenges</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl text-center">
              <div className="text-2xl font-bold text-white">{unreadMessages}</div>
              <div className="text-sm text-slate-400">New Messages</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl text-center">
              <div className="text-2xl font-bold text-white">
                {profile?.user_type === 'wallet_only' ? 'Wallet' : 'Full'}
              </div>
              <div className="text-sm text-slate-400">Account Type</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-xl text-center">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-sm text-slate-400">Your Challenges</div>
            </div>
          </div>
        )}

        {/* Main Action Sections */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="p-8 bg-gradient-to-br from-blue-900/30 to-slate-800/50 rounded-2xl border border-blue-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Start Trading</h2>
            <p className="text-slate-300 mb-6">
              Swap tokens instantly with Jupiter aggregation. Best rates with 0.5% service fee.
            </p>
            <Link
              href="/swap"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl font-bold transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Go to Swap
            </Link>
          </div>

          <div className="p-8 bg-gradient-to-br from-purple-900/30 to-slate-800/50 rounded-2xl border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Explore dApps</h2>
            <p className="text-slate-300 mb-6">
              Access Solana dApps securely through our built-in browser.
            </p>
            <Link
              href="/browser"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl font-bold transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Open dApp Browser
            </Link>
          </div>
        </div>

        {/* Mobile Action Buttons (Fixed) */}
        <div className="lg:hidden fixed bottom-6 right-6 flex flex-col gap-3 z-30">
          <button
            onClick={() => setShowChat(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-lg relative"
            aria-label="Open chat"
          >
            <span className="text-2xl">💬</span>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-500 to-red-500 rounded-full text-xs font-bold flex items-center justify-center animate-pulse">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setShowChallenge(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-600 to-orange-600 flex items-center justify-center shadow-lg relative"
            aria-label="Open challenges"
          >
            <span className="text-2xl">⚔️</span>
            {activeChallenges > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-xs font-bold flex items-center justify-center">
                {activeChallenges > 9 ? '9+' : activeChallenges}
              </span>
            )}
          </button>
        </div>
      </main>

      <footer className="mt-16 py-8 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">CiBL Wallet</h3>
              <p className="text-slate-400 text-sm">
                Decentralized Solana wallet with integrated trading challenges and community chat.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Wallet Management</li>
                <li>Trading Challenges</li>
                <li>Community Chat</li>
                <li>Token Swaps</li>
                <li>dApp Browser</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-400">GitHub</a></li>
                <li><a href="#" className="hover:text-blue-400">API Reference</a></li>
                <li><a href="#" className="hover:text-blue-400">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-blue-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-400">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-400">Risk Disclosure</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} CiBL Wallet. All rights reserved. Built on Solana.
            </p>
            <p className="text-xs text-slate-600 mt-2">
              This is a demo application. Use at your own risk.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}