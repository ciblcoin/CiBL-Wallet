import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { PublicKey, SystemProgram, Keypair } from '@solana/web3.js';
import { CiBLChallenge } from './idl/cibl_challenge';

export interface ChallengeData {
  creator: PublicKey;
  acceptor: PublicKey | null;
  amount: anchor.BN;
  assetPair: string;
  startTime: anchor.BN | null;
  endTime: anchor.BN | null;
  status: number; // 0: open, 1: active, 2: completed, 3: cancelled
  creatorEntryPrice: anchor.BN | null;
  acceptorEntryPrice: anchor.BN | null;
  creatorExitPrice: anchor.BN | null;
  acceptorExitPrice: anchor.BN | null;
  winner: PublicKey | null;
}

export class ChallengeContract {
  program: Program<CiBLChallenge>;
  provider: anchor.AnchorProvider;
  
  constructor(provider: anchor.AnchorProvider, programId: PublicKey) {
    this.provider = provider;
    this.program = new Program<CiBLChallenge>(
      require('./idl/cibl_challenge.json'),
      programId,
      provider
    );
  }

  // Create a new challenge
  async createChallenge(
    creator: PublicKey,
    amount: number,
    assetPair: string,
    duration: number
  ): Promise<string> {
    const challengeKeypair = Keypair.generate();
    const amountLamports = new anchor.BN(amount * anchor.web3.LAMPORTS_PER_SOL);
    
    try {
      const tx = await this.program.methods
        .createChallenge(
          amountLamports,
          assetPair,
          new anchor.BN(duration)
        )
        .accounts({
          challenge: challengeKeypair.publicKey,
          creator: creator,
          systemProgram: SystemProgram.programId,
        })
        .signers([challengeKeypair])
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  // Accept a challenge
  async acceptChallenge(
    challengePubkey: PublicKey,
    acceptor: PublicKey
  ): Promise<string> {
    try {
      const tx = await this.program.methods
        .acceptChallenge()
        .accounts({
          challenge: challengePubkey,
          acceptor: acceptor,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error accepting challenge:', error);
      throw error;
    }
  }

  // Submit entry price (when trading starts)
  async submitEntryPrice(
    challengePubkey: PublicKey,
    user: PublicKey,
    price: number
  ): Promise<string> {
    const priceBN = new anchor.BN(price * 1e8); // 8 decimal precision
    
    try {
      const tx = await this.program.methods
        .submitEntryPrice(priceBN)
        .accounts({
          challenge: challengePubkey,
          user: user,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error submitting entry price:', error);
      throw error;
    }
  }

  // Submit exit price (when trading ends)
  async submitExitPrice(
    challengePubkey: PublicKey,
    user: PublicKey,
    price: number
  ): Promise<string> {
    const priceBN = new anchor.BN(price * 1e8); // 8 decimal precision
    
    try {
      const tx = await this.program.methods
        .submitExitPrice(priceBN)
        .accounts({
          challenge: challengePubkey,
          user: user,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error submitting exit price:', error);
      throw error;
    }
  }

  // Calculate and declare winner
  async declareWinner(
    challengePubkey: PublicKey
  ): Promise<string> {
    try {
      const tx = await this.program.methods
        .declareWinner()
        .accounts({
          challenge: challengePubkey,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error declaring winner:', error);
      throw error;
    }
  }

  // Cancel challenge (only creator, before acceptance)
  async cancelChallenge(
    challengePubkey: PublicKey,
    creator: PublicKey
  ): Promise<string> {
    try {
      const tx = await this.program.methods
        .cancelChallenge()
        .accounts({
          challenge: challengePubkey,
          creator: creator,
        })
        .rpc();
      
      return tx;
    } catch (error) {
      console.error('Error cancelling challenge:', error);
      throw error;
    }
  }

  // Get challenge data
  async getChallengeData(
    challengePubkey: PublicKey
  ): Promise<ChallengeData | null> {
    try {
      const challenge = await this.program.account.challenge.fetch(challengePubkey);
      
      return {
        creator: challenge.creator,
        acceptor: challenge.acceptor,
        amount: challenge.amount,
        assetPair: challenge.assetPair,
        startTime: challenge.startTime,
        endTime: challenge.endTime,
        status: challenge.status,
        creatorEntryPrice: challenge.creatorEntryPrice,
        acceptorEntryPrice: challenge.acceptorEntryPrice,
        creatorExitPrice: challenge.creatorExitPrice,
        acceptorExitPrice: challenge.acceptorExitPrice,
        winner: challenge.winner
      };
    } catch (error) {
      console.error('Error fetching challenge data:', error);
      return null;
    }
  }

  // Get all challenges for a user
  async getUserChallenges(
    userPubkey: PublicKey
  ): Promise<PublicKey[]> {
    try {
      const challenges = await this.program.account.challenge.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: userPubkey.toBase58()
          }
        }
      ]);
      
      return challenges.map(c => c.publicKey);
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      return [];
    }
  }

  // Calculate PnL for a challenge
  calculatePnL(
    entryPrice: anchor.BN,
    exitPrice: anchor.BN,
    amount: anchor.BN
  ): number {
    if (!entryPrice || !exitPrice) return 0;
    
    const entry = entryPrice.toNumber() / 1e8;
    const exit = exitPrice.toNumber() / 1e8;
    const amountSol = amount.toNumber() / anchor.web3.LAMPORTS_PER_SOL;
    
    return (exit - entry) * amountSol;
  }
}

// IDL structure (simplified example)
export interface CiBLChallenge {
  version: '0.1.0';
  name: 'cibl_challenge';
  instructions: [
    {
      name: 'createChallenge';
      accounts: [
        { name: 'challenge'; isMut: true; isSigner: true; },
        { name: 'creator'; isMut: true; isSigner: true; },
        { name: 'systemProgram'; isMut: false; isSigner: false; }
      ];
      args: [
        { name: 'amount'; type: 'u64'; },
        { name: 'assetPair'; type: 'string'; },
        { name: 'duration'; type: 'u64'; }
      ];
    },
    {
      name: 'acceptChallenge';
      accounts: [
        { name: 'challenge'; isMut: true; isSigner: false; },
        { name: 'acceptor'; isMut: true; isSigner: true; }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: 'Challenge';
      type: {
        kind: 'struct';
        fields: [
          { name: 'creator'; type: 'publicKey'; },
          { name: 'acceptor'; type: { option: 'publicKey' }; },
          { name: 'amount'; type: 'u64'; },
          { name: 'assetPair'; type: 'string'; },
          { name: 'startTime'; type: { option: 'i64' }; },
          { name: 'endTime'; type: { option: 'i64' }; },
          { name: 'status'; type: 'u8'; },
          { name: 'creatorEntryPrice'; type: { option: 'u64' }; },
          { name: 'acceptorEntryPrice'; type: { option: 'u64' }; },
          { name: 'creatorExitPrice'; type: { option: 'u64' }; },
          { name: 'acceptorExitPrice'; type: { option: 'u64' }; },
          { name: 'winner'; type: { option: 'publicKey' }; }
        ];
      };
    }
  ];
}