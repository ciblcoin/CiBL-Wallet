import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CiBL Wallet - Solana Web3 Wallet',
  description: 'Decentralized wallet with internal key management and external wallet connection',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-slate-900 to-blue-950 min-h-screen`}>
        <Providers>
          {/* Header */}
          <header className="border-b border-blue-800/30">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10">
                  <Image 
                    src="/logo.png" 
                    alt="CiBL Logo" 
                    fill
                    className="rounded-full"
                  />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
                  CiBL Wallet
                </h1>
              </div>
              <nav className="flex space-x-4">
                <a href="/" className="text-blue-300 hover:text-yellow-300 transition-colors">Home</a>
                <a href="/swap" className="text-blue-300 hover:text-yellow-300 transition-colors">Swap</a>
                <a href="/browser" className="text-blue-300 hover:text-yellow-300 transition-colors">dApps</a>
              </nav>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          
          {/* Footer */}
          <footer className="border-t border-blue-800/30 mt-12 py-6">
            <div className="container mx-auto px-4 text-center text-blue-300">
              <p>© 2024 CiBL Wallet. All rights reserved.</p>
              <p className="text-sm mt-2 text-blue-400/80">Powered by Solana Network</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}