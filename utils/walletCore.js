import { 
  Keypair, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  PublicKey,
  Connection,
  sendAndConfirmTransaction,
  clusterApiUrl
} from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { createClient } from '@/lib/supabase/client';

const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
const CONNECTION = new Connection(clusterApiUrl(NETWORK));

export class CiBLWalletCore {
  constructor() {
    this.keypair = null;
    this.publicKey = null;
    this.connection = CONNECTION;
  }

  // Generate new wallet with mnemonic
  async generateNewWallet() {
    try {
      // Generate 12-word mnemonic
      const mnemonic = bip39.generateMnemonic(128); // 12 words
      
      // Generate seed from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // Create keypair from seed
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
      this.keypair = Keypair.fromSeed(derivedSeed.slice(0, 32));
      this.publicKey = this.keypair.publicKey;
      
      return {
        success: true,
        mnemonic: mnemonic,
        publicKey: this.publicKey.toString(),
        secretKey: Array.from(this.keypair.secretKey),
        keypair: this.keypair
      };
    } catch (error) {
      console.error('Error generating wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Restore wallet from mnemonic
  async restoreFromMnemonic(mnemonic) {
    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(mnemonic)) {
        return { success: false, error: 'Invalid mnemonic phrase' };
      }
      
      // Generate seed from mnemonic
      const seed = await bip39.mnemonicToSeed(mnemonic);
      
      // Create keypair from seed
      const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
      this.keypair = Keypair.fromSeed(derivedSeed.slice(0, 32));
      this.publicKey = this.keypair.publicKey;
      
      return {
        success: true,
        publicKey: this.publicKey.toString(),
        secretKey: Array.from(this.keypair.secretKey),
        keypair: this.keypair
      };
    } catch (error) {
      console.error('Error restoring wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Import wallet from private key array
  importFromPrivateKey(privateKeyArray) {
    try {
      this.keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
      this.publicKey = this.keypair.publicKey;
      
      return {
        success: true,
        publicKey: this.publicKey.toString(),
        keypair: this.keypair
      };
    } catch (error) {
      console.error('Error importing wallet:', error);
      return { success: false, error: error.message };
    }
  }

  // Get wallet balance
  async getBalance(publicKeyString = null) {
    try {
      const pubkey = publicKeyString 
        ? new PublicKey(publicKeyString)
        : this.publicKey;
      
      const balance = await this.connection.getBalance(pubkey);
      return {
        success: true,
        balance: balance / LAMPORTS_PER_SOL,
        balanceLamports: balance
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return { success: false, error: error.message };
    }
  }

  // Send SOL transaction
  async sendSOL(toAddress, amount) {
    try {
      if (!this.keypair) {
        return { success: false, error: 'Wallet not initialized' };
      }
      
      const toPubkey = new PublicKey(toAddress);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.publicKey,
          toPubkey: toPubkey,
          lamports: amount * LAMPORTS_PER_SOL
        })
      );
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;
      
      // Sign and send transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.keypair]
      );
      
      return {
        success: true,
        signature: signature,
        transaction: transaction
      };
    } catch (error) {
      console.error('Error sending SOL:', error);
      return { success: false, error: error.message };
    }
  }

  // Get transaction history
  async getTransactionHistory(limit = 10) {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        this.publicKey,
        { limit: limit }
      );
      
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await this.connection.getTransaction(sig.signature);
          return {
            signature: sig.signature,
            slot: sig.slot,
            timestamp: sig.blockTime ? new Date(sig.blockTime * 1000) : null,
            status: sig.err ? 'failed' : 'success',
            details: tx
          };
        })
      );
      
      return {
        success: true,
        transactions: transactions
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
export const walletCore = new CiBLWalletCore();