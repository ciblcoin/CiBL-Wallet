'use client';

import { useState } from 'react';
import WalletAuth from './WalletAuth';
import EmailAuth from './EmailAuth';
import LinkWalletModal from './LinkWalletModal';

export default function AuthManager() {
  const [authMode, setAuthMode] = useState('choose'); // 'choose', 'wallet', 'email'
  const [userData, setUserData] = useState(null);

  // حالت‌های مختلف
  if (authMode === 'choose') {
    return (
      <div className="p-8 bg-slate-800/50 rounded-2xl border border-blue-500/20">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          🚀 Join CiBL Wallet
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Wallet Login */}
          <div 
            onClick={() => setAuthMode('wallet')}
            className="p-6 bg-gradient-to-br from-blue-900/30 to-slate-800 rounded-xl border border-blue-500/30 hover:border-blue-500 cursor-pointer transition-all"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👛</span>
              </div>
              <h3 className="text-xl font-bold text-white">Connect Wallet</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Instant access to chat & challenges
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Auto-generated username
              </li>
              <li className="flex items-center">
                <span className="text-yellow-400 mr-2">⚠</span>
                Add email later for full features
              </li>
            </ul>
            <button className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg font-bold">
              Connect Wallet
            </button>
          </div>

          {/* Email Login */}
          <div 
            onClick={() => setAuthMode('email')}
            className="p-6 bg-gradient-to-br from-purple-900/30 to-slate-800 rounded-xl border border-purple-500/30 hover:border-purple-500 cursor-pointer transition-all"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <h3 className="text-xl font-bold text-white">Sign Up with Email</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Custom username
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Email notifications
              </li>
              <li className="flex items-center">
                <span className="text-blue-400 mr-2">🔗</span>
                Connect wallet later for trading
              </li>
            </ul>
            <button className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg font-bold">
              Continue with Email
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700">
          <p className="text-center text-slate-400 text-sm">
            Already have an account?{' '}
            <button 
              onClick={() => setAuthMode('email')}
              className="text-blue-400 hover:text-blue-300"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (authMode === 'wallet') {
    return (
      <WalletAuth 
        onSuccess={(user) => {
          setUserData(user);
          setAuthMode('completed');
        }}
        onBack={() => setAuthMode('choose')}
      />
    );
  }

  if (authMode === 'email') {
    return (
      <EmailAuth 
        onSuccess={(user) => {
          setUserData(user);
          setAuthMode('link_wallet');
        }}
        onBack={() => setAuthMode('choose')}
      />
    );
  }

  if (authMode === 'link_wallet') {
    return (
      <LinkWalletModal 
        userId={userData.id}
        onSuccess={(fullUser) => {
          setUserData(fullUser);
          setAuthMode('completed');
        }}
        skipForNow={() => setAuthMode('completed')}
      />
    );
  }

  return null;
}