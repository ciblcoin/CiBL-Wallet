import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { walletCore } from './walletCore';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

export class JupiterSwap {
  constructor() {
    this.connection = walletCore.connection;
  }

  // Get quote for swap
  async getQuote(inputMint, outputMint, amount, slippage = 0.5) {
    try {
      const params = new URLSearchParams({
        inputMint: inputMint,
        outputMint: outputMint,
        amount: amount.toString(),
        slippageBps: Math.floor(slippage * 100).toString(),
        feeBps: '5', // 0.05% CiBL fee
      });

      const response = await fetch(`${JUPITER_API}/quote?${params}`);
      
      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status}`);
      }

      const quote = await response.json();
      
      return {
        success: true,
        quote: quote,
        inputAmount: amount,
        outputAmount: quote.outAmount,
        priceImpact: quote.priceImpactPct,
        fees: {
          platform: quote.platformFee,
          liquidity: quote.lpFee
        }
      };
    } catch (error) {
      console.error('Error getting quote:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Execute swap
  async executeSwap(quoteResponse, walletPublicKey) {
    try {
      // Get swap transaction
      const swapResponse = await fetch(`${JUPITER_API}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse: quoteResponse,
          userPublicKey: walletPublicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto'
        })
      });

      if (!swapResponse.ok) {
        throw new Error(`Swap API error: ${swapResponse.status}`);
      }

      const { swapTransaction } = await swapResponse.json();

      // Deserialize transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      return {
        success: true,
        transaction: transaction,
        rawTransaction: swapTransaction
      };
    } catch (error) {
      console.error('Error executing swap:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get token list
  async getTokenList() {
    try {
      const response = await fetch('https://token.jup.ag/all');
      
      if (!response.ok) {
        throw new Error(`Token list error: ${response.status}`);
      }

      const tokens = await response.json();
      
      // Filter popular tokens
      const popularTokens = tokens.filter(token => 
        [
          SOL_MINT,
          USDC_MINT,
          USDT_MINT,
          'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
          '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH
          'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
          'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE' // ORCA
        ].includes(token.address)
      );

      return {
        success: true,
        tokens: popularTokens,
        allTokens: tokens
      };
    } catch (error) {
      console.error('Error getting token list:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get price for token pair
  async getPrice(inputMint, outputMint, amount = 1) {
    try {
      const quote = await this.getQuote(
        inputMint,
        outputMint,
        amount * (10 ** 9) // Assume 9 decimals for amount
      );

      if (!quote.success) {
        throw new Error(quote.error);
      }

      return {
        success: true,
        price: Number(quote.quote.outAmount) / (10 ** 9),
        quote: quote.quote
      };
    } catch (error) {
      console.error('Error getting price:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get swap history for address
  async getSwapHistory(address, limit = 10) {
    try {
      // This would require indexing service or using on-chain data
      // For now, return mock data or implement with your own indexing
      return {
        success: true,
        history: [],
        message: 'Swap history requires transaction indexing'
      };
    } catch (error) {
      console.error('Error getting swap history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
export const jupiterSwap = new JupiterSwap();