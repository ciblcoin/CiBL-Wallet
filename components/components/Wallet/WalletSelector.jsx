'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
  useConnection,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  SolletWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { createClient } from '@/lib/supabase/client';

// Default styles for wallet buttons
import '@solana/wallet-adapter-react-ui/styles.css';

function WalletContent() {
  const { publicKey, wallet, disconnect, signMessage } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [supabase] = useState(() => createClient());

  // Fetch balance when wallet connects
  useEffect(() => {
    if (publicKey && connection) {
      const fetchBalance = async () => {
        try {
          const balance = await connection.getBalance(publicKey);
          setBalance(balance / 1000000000); // Convert lamports to SOL
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      };
      fetchBalance();
      
      // Also update profile with wallet address
      updateProfileWithWallet();
    } else {
      setBalance(null);
      setProfile(null);
    }
  }, [publicKey, connection]);

  // Update user profile with wallet address
  const updateProfileWithWallet = async () => {
    if (!publicKey || !wallet) return;
    
    try {
      // Check if user is authenticated via Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is logged in with email - link wallet to existing profile
        const { error } = await supabase
          .from('profiles')
          .upsert({
            auth_id: user.id,
            solana_address: publicKey.toString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'auth_id'
          });

        if (error) {
          console.error('Error linking wallet:', error);
        } else {
          console.log('Wallet linked to profile');
        }
      } else {
        // User is not logged in with email - check if wallet profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('solana_address', publicKey.toString())
          .single();

        if (existingProfile) {
          setProfile(existingProfile);
        } else {
          // Create new profile for wallet-only user
          const username = `wallet_${publicKey.toString().slice(0, 8)}`;
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              solana_address: publicKey.toString(),
              username: username,
              email: null,
              auth_id: null,
            })
            .select()
            .single();

          if (newProfile) {
            setProfile(newProfile);
          }
        }
      }
    } catch (error) {
      console.error('Error in wallet profile setup:', error);
    }
  };

  // Sign message for authentication (optional)
  const handleSignMessage = async () => {
    if (!publicKey || !signMessage) {
      alert('Wallet does not support message signing');
      return;
    }

    setLoading(true);
    try {
      const message = `Sign this message to authenticate with CiBL Wallet at ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);
      
      // Here you would send the signature to your backend for verification
      console.log('Signature:', signature);
      alert('Message signed successfully!');
    } catch (error) {
      console.error('Error signing message:', error);
      alert('Failed to sign message');
    } finally {
      setLoading(false);
    }
  };

  // Copy address to clipboard
  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      alert('Address copied to clipboard!');
    }
  };

  return (
    <div className="wallet-selector-container">
      <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-blue-500/20 shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-slate-400">
            Connect your Solana wallet to use chat, create challenges, and trade.
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !rounded-lg !font-bold !py-3 !px-6 hover:!from-blue-700 hover:!to-purple-700" />
          </div>

          {wallet && publicKey && (
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="space-y-4">
                {/* Wallet Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{wallet.adapter.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">{wallet.adapter.name}</p>
                      <p className="text-xs text-slate-400">Connected</p>
                    </div>
                  </div>
                  <button
                    onClick={disconnect}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded-lg font-bold"
                  >
                    Disconnect
                  </button>
                </div>

                {/* Address */}
                <div>
                  <p className="text-sm text-slate-400 mb-1">Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-slate-900 rounded text-sm truncate">
                      {publicKey.toString()}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                      title="Copy address"
                    >
                      📋
                    </button>
                  </div>
                </div>

                {/* Balance */}
                {balance !== null && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Balance</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-slate-900 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-white">
                            {balance.toFixed(4)} SOL
                          </span>
                          <span className="text-slate-400 text-sm">
                            ≈ ${(balance * 100).toFixed(2)} {/* Example conversion */}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Info */}
                {profile && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Profile</p>
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">@{profile.username}</p>
                          <p className="text-xs text-slate-400">
                            {profile.email || 'Wallet-only user'}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={handleSignMessage}
                    disabled={loading || !signMessage}
                    className={`py-2 rounded-lg font-bold ${
                      loading || !signMessage
                        ? 'bg-gray-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    }`}
                  >
                    {loading ? 'Signing...' : 'Sign Message'}
                  </button>
                  <Link
                    href="/swap"
                    className="py-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-bold"
                  >
                    Trade Now
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!wallet && (
            <div className="mt-6 text-center">
              <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-2">Supported Wallets</h3>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { name: 'Phantom', color: 'from-purple-500 to-pink-500' },
                    { name: 'Solflare', color: 'from-orange-500 to-red-500' },
                    { name: 'Torus', color: 'from-blue-500 to-cyan-500' },
                    { name: 'Ledger', color: 'from-gray-700 to-gray-900' },
                  ].map((wallet) => (
                    <div
                      key={wallet.name}
                      className={`p-3 bg-gradient-to-br ${wallet.color} rounded-lg text-center`}
                    >
                      <p className="font-bold text-white">{wallet.name}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  Install a wallet extension to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Wallet Selector Component
export default function WalletSelector() {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}