import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

// Network configuration
const NETWORK = 'mainnet-beta';
const RPC_URL = 'https://api.mainnet-beta.solana.com'; // You can replace with your own RPC

// Create connection
export const connection = new Connection(RPC_URL, 'confirmed');

export class SolanaClient {
  // Get SOL balance for a public key
  static async getBalance(publicKey) {
    try {
      const key = new PublicKey(publicKey);
      const balance = await connection.getBalance(key);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  // Get recent transactions for an address
  static async getRecentTransactions(publicKey, limit = 5) {
    try {
      const key = new PublicKey(publicKey);
      const signatures = await connection.getSignaturesForAddress(key, { limit });
      return signatures;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // Get token accounts (SPL tokens)
  static async getTokenAccounts(publicKey) {
    try {
      const key = new PublicKey(publicKey);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(key, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      });
      
      return tokenAccounts.value.map(account => ({
        mint: account.account.data.parsed.info.mint,
        amount: account.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: account.account.data.parsed.info.tokenAmount.decimals
      }));
    } catch (error) {
      console.error('Error getting token accounts:', error);
      return [];
    }
  }

  // Get transaction details
  static async getTransaction(signature) {
    try {
      const tx = await connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0
      });
      return tx;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  // Estimate transaction fee
  static async getFeeEstimate() {
    try {
      const { value: feeCalculator } = await connection.getRecentBlockhash();
      const lamportsPerSignature = feeCalculator.feeCalculator.lamportsPerSignature;
      return lamportsPerSignature / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting fee estimate:', error);
      return 0.000005; // Default fallback
    }
  }

  // Check if address is valid
  static isValidAddress(address) {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get network info
  static async getNetworkInfo() {
    try {
      const version = await connection.getVersion();
      const epochInfo = await connection.getEpochInfo();
      const slot = await connection.getSlot();
      
      return {
        version: version['solana-core'],
        epoch: epochInfo.epoch,
        slot: slot,
        blockHeight: epochInfo.blockHeight
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }
}

// Helper function for development
export const switchToDevnet = () => {
  return new Connection(clusterApiUrl('devnet'), 'confirmed');
};

export const switchToTestnet = () => {
  return new Connection(clusterApiUrl('testnet'), 'confirmed');
};

// Export default connection for easy imports
export default connection;