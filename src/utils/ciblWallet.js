import { Keypair } from '@solana/web3.js';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

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
      
      return {
        success: true,
        mnemonic: this.mnemonic,
        publicKey: this.keypair.publicKey.toString(),
        secretKey: Buffer.from(this.keypair.secretKey).toString('hex')
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
      
      return {
        success: true,
        publicKey: this.keypair.publicKey.toString()
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
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