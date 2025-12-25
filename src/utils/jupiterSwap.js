import axios from 'axios';
import { VersionedTransaction, PublicKey } from '@solana/web3.js';

// Your CiBL Wallet fee address and rate
const CIBL_FEE_ADDRESS = new PublicKey('3oPNk1DbiaQyf1xsvzH8BAoMFyF1mxGWZitECnqWaQGF');
const PLATFORM_FEE_BPS = 50; // 0.5% expressed in Basis Points

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

  // Get best quote for swap
  async getQuote(inputMint, outputMint, amount, slippageBps = 100) {
    try {
      const amountInLamports = Math.floor(amount * Math.pow(10, 9));
      
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount: amountInLamports,
          slippageBps,
          feeBps: PLATFORM_FEE_BPS, // Add CiBL fee
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

  // Calculate CiBL fee
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

  // Execute swap with fee
  async executeSwap(quoteResponse) {
    try {
      if (!this.wallet || !this.wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Get transaction from Jupiter WITH fee account
      const swapResponse = await axios.post(`${this.baseUrl}/swap`, {
        quoteResponse,
        userPublicKey: this.wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 100000,
        // *** CRITICAL: Fee account for revenue collection ***
        feeAccount: CIBL_FEE_ADDRESS.toString()
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