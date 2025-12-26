
# CiBL Wallet - Solana Web3 Wallet

A decentralized wallet built on Solana blockchain with dual connection options: internal wallet management and external wallet connectivity.

## 🌟 Features

### Core Features
- **Internal Wallet Management**: Create new wallets or import existing ones with secure key storage
- **External Wallet Connection**: Connect with Phantom, Solflare, and other popular wallets
- **Token Swaps**: Instant token swapping powered by Jupiter Aggregator with best rates
- **dApp Browser**: Built-in browser to explore and connect to Solana dApps
- **Secure Recovery**: 12/24-word mnemonic phrase for wallet recovery

### Technical Features
- Built with Next.js 14 and React
- Solana Web3.js integration
- Jupiter Swap API integration
- Tailwind CSS for styling
- TypeScript support
- Cloudflare Workers deployment ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- Solana CLI (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ciblcoin/CiBL-Wallet.git
cd CiBL-Wallet
```

1. Install dependencies

```bash
npm install
```

1. Run development server

```bash
npm run dev
```

1. Open in browser

```
http://localhost:3000
```

📦 Project Structure

```
CiBL-Wallet/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── browser/        # dApp browser page
│   │   ├── swap/          # Swap interface page
│   │   ├── globals.css    # Global styles
│   │   ├── layout.jsx     # Root layout
│   │   ├── page.jsx       # Home page
│   │   └── providers.jsx  # Wallet providers
│   ├── components/         # React components
│   │   ├── Browser/       # dApp browser components
│   │   ├── Swap/         # Swap interface components
│   │   └── Wallet/       # Wallet management components
│   └── utils/             # Utility functions
│       ├── ciblWallet.js  # Internal wallet logic
│       ├── jupiterSwap.js # Jupiter swap service
│       └── solanaClient.js # Solana RPC client
├── public/                # Static assets
├── .gitignore
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies
├── README.md            # This file
└── wrangler.toml        # Cloudflare Workers config
```

🔧 Configuration

Environment Variables

Create a .env.local file in the root directory:

```env
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_CIBL_FEE_ADDRESS=3oPNk1DbiaQyf1xsvzH8BAoMFyF1mxGWZitECnqWaQGF
```

Fee Structure

· CiBL Service Fee: 0.5% on all swaps (supports development)
· Jupiter Fee: 0.1% (network fee)
· Total Fee: 0.6% per swap

🌐 Deployment

Cloudflare Workers

1. Install Wrangler CLI:

```bash
npm install -g wrangler
```

1. Login to Cloudflare:

```bash
wrangler login
```

1. Deploy:

```bash
npm run deploy
```

Vercel

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

🔒 Security

Wallet Security

· Private keys never leave the user's device
· Mnemonic phrases are only shown once during wallet creation
· No server-side storage of sensitive data
· HTTPS only for all connections

Best Practices

1. Never share your recovery phrase with anyone
2. Always verify transaction details before signing
3. Use hardware wallets for large amounts
4. Keep your recovery phrase in a secure, offline location
5. Regularly update the application

🤝 Contributing

1. Fork the repository
2. Create a feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments

· Solana Labs for the amazing blockchain
· Jupiter Exchange for swap aggregation
· Solana Wallet Adapter for wallet connectivity
· Next.js for the React framework

📞 Support

For support, email support@cibl.app or visit cibl.app.

---

Important: Always test with small amounts first. This is experimental software. Use at your own risk.

```

---




