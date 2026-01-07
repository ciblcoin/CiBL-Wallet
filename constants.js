// constants/index.js
export const CHALLENGE_CONFIG = {
  STATUS: {
    OPEN: 'open',
    JOINED: 'joined',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
  },
  DURATION: {
    DEFAULT_MINUTES: 5,
    MAX_MINUTES: 60,
    MIN_MINUTES: 1
  },
  AMOUNT: {
    MIN_USD: 5,
    MAX_USD: 100,
    DEFAULT_USD: 10,
    STEP_USD: 5
  },
  ASSET_PAIRS: [
    { value: 'SOL/USDC', label: 'SOL / USDC', base: 'SOL', quote: 'USDC' },
    { value: 'ETH/USDC', label: 'ETH / USDC', base: 'ETH', quote: 'USDC' },
    { value: 'BTC/USDC', label: 'BTC / USDC', base: 'BTC', quote: 'USDC' },
  ]
};

export const REAL_TIME_CONFIG = {
  CHANNELS: {
    CHAT: 'public-chat-room',
    CHALLENGES: 'challenges-realtime',
    NOTIFICATIONS: 'user-notifications'
  },
  EVENTS: {
    CHALLENGE_CREATED: 'challenge_created',
    CHALLENGE_JOINED: 'challenge_joined',
    CHAT_MESSAGE: 'chat_message'
  }
};

export const WALLET_CONFIG = {
  SUPPORTED_WALLETS: [
    'Phantom',
    'Solflare', 
    'Backpack',
    'Glow',
    'Coin98',
    'Torus',
    'Ledger'
  ],
  NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta'
};