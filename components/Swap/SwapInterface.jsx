'use client';

import { useState, useEffect } from 'react';
import { jupiterSwap } from '@/utils/jupiterSwap';
import { walletCore } from '@/utils/walletCore';
import { useWallet } from '@solana/wallet-adapter-react';
import useUser from '@/hooks/useUser';

export default function SwapInterface() {
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [showTokenSelector, setShowTokenSelector] = useState(null); // 'from' or 'to'
  
  const { publicKey, signTransaction } = useWallet();
  const { user } = useUser();

  // Load token list on mount
  useEffect(() => {
    loadTokens();
  }, []);

  // Update quote when inputs change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (fromAmount && parseFloat(fromAmount) > 0) {
        getQuote();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [fromAmount, fromToken, toToken, slippage]);

  const loadTokens = async () => {
    const result = await jupiterSwap.getTokenList();
    if (result.success) {
      setTokens(result.tokens);
    }
  };

  const getQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;

    setLoading(true);
    
    try {
      const fromTokenInfo = tokens.find(t => t.symbol === fromToken);
      const toTokenInfo = tokens.find(t => t.symbol === toToken);

      if (!fromTokenInfo || !toTokenInfo) {
        throw new Error('Token not found');
      }

      const amount = parseFloat(fromAmount) * (10 ** fromTokenInfo.decimals);
      
      const result = await jupiterSwap.getQuote(
        fromTokenInfo.address,
        toTokenInfo.address,
        Math.floor(amount).toString(),
        slippage
      );

      if (result.success) {
        setQuote(result.quote);
        setToAmount((result.outputAmount / (10 ** toTokenInfo.decimals)).toFixed(6));
      } else {
        setQuote(null);
        setToAmount('');
      }
    } catch (error) {
      console.error('Error getting quote:', error);
      setQuote(null);
      setToAmount('');
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!publicKey || !signTransaction || !quote) {
      alert('Please connect your wallet');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      alert('Please enter an amount');
      return;
    }

    setLoading(true);

    try {
      const fromTokenInfo = tokens.find(t => t.symbol === fromToken);
      
      // Execute swap
      const swapResult = await jupiterSwap.executeSwap(
        quote,
        publicKey.toString()
      );

      if (!swapResult.success) {
        throw new Error(swapResult.error);
      }

      // Sign transaction
      const signedTransaction = await signTransaction(swapResult.transaction);

      // Send transaction
      const rawTransaction = signedTransaction.serialize();
      const signature = await walletCore.connection.sendRawTransaction(
        rawTransaction,
        { skipPreflight: false, preflightCommitment: 'confirmed' }
      );

      // Confirm transaction
      const confirmation = await walletCore.connection.confirmTransaction({
        signature,
        blockhash: swapResult.transaction.message.recentBlockhash,
        lastValidBlockHeight: swapResult.transaction.message.lastValidBlockHeight
      });

      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      alert(`Swap successful! Signature: ${signature}`);
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      setQuote(null);

    } catch (error) {
      console.error('Swap error:', error);
      alert(`Swap failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const getTokenMint = (symbol) => {
    const token = tokens.find(t => t.symbol === symbol);
    return token ? token.address : '';
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-800/50 rounded-2xl border border-blue-500/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Swap Tokens</h2>
        <div className="text-sm text-slate-400">
          Powered by Jupiter
        </div>
      </div>

      {/* From Token */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-slate-400">From</label>
          <div className="text-sm text-slate-400">
            Balance: {user ? 'Loading...' : '0.00'}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTokenSelector('from')}
            className="px-4 py-3 bg-slate-900 rounded-lg flex items-center gap-2 hover:bg-slate-800"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <span className="font-bold">{fromToken}</span>
            <span>▼</span>
          </button>
          <div className="flex-1">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-right text-xl"
              step="any"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center my-4">
        <button
          onClick={handleSwitchTokens}
          className="w-12 h-12 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center hover:bg-slate-800"
        >
          <span className="text-2xl">⇅</span>
        </button>
      </div>

      {/* To Token */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <label className="text-sm text-slate-400">To</label>
          <div className="text-sm text-slate-400">
            Balance: {user ? 'Loading...' : '0.00'}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTokenSelector('to')}
            className="px-4 py-3 bg-slate-900 rounded-lg flex items-center gap-2 hover:bg-slate-800"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <span className="font-bold">{toToken}</span>
            <span>▼</span>
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={toAmount || '0.0'}
              readOnly
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-right text-xl opacity-80"
            />
          </div>
        </div>
      </div>

      {/* Swap Details */}
      {quote && (
        <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Rate</span>
              <span className="text-white">
                1 {fromToken} = {(quote.outAmount / quote.inAmount).toFixed(6)} {toToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Price Impact</span>
              <span className={quote.priceImpactPct > 1 ? 'text-yellow-400' : 'text-green-400'}>
                {quote.priceImpactPct}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Minimum Received</span>
              <span className="text-white">
                {quote.otherAmountThreshold} {toToken}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Slippage Tolerance</span>
              <span className="text-white">{slippage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Route</span>
              <span className="text-blue-400">
                {quote.routePlan?.length || 1} hop{quote.routePlan?.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Slippage Settings */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          Slippage Tolerance: {slippage}%
        </label>
        <div className="flex gap-2">
          {[0.1, 0.5, 1.0].map((value) => (
            <button
              key={value}
              onClick={() => setSlippage(value)}
              className={`flex-1 py-2 rounded-lg ${
                slippage === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {value}%
            </button>
          ))}
          <div className="flex-1 relative">
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(Math.max(0.1, Math.min(100, parseFloat(e.target.value) || 0.5)))}
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center"
              step="0.1"
              min="0.1"
              max="100"
            />
            <span className="absolute right-3 top-2 text-slate-400">%</span>
          </div>
        </div>
      </div>

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={loading || !fromAmount || !quote || !publicKey}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          loading || !fromAmount || !quote || !publicKey
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin mr-2">⟳</span>
            Processing...
          </span>
        ) : !publicKey ? (
          'Connect Wallet to Swap'
        ) : !fromAmount ? (
          'Enter Amount'
        ) : (
          `Swap ${fromToken} for ${toToken}`
        )}
      </button>

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Select Token</h3>
                <button
                  onClick={() => setShowTokenSelector(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="Search token name or address"
                className="w-full mt-3 p-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {tokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    if (showTokenSelector === 'from') {
                      setFromToken(token.symbol);
                    } else {
                      setToToken(token.symbol);
                    }
                    setShowTokenSelector(null);
                  }}
                  className="w-full p-4 flex items-center gap-3 hover:bg-slate-800 border-b border-slate-800"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    {token.symbol.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-bold">{token.symbol}</div>
                    <div className="text-sm text-slate-400">{token.name}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm text-slate-400">Balance</div>
                    <div className="font-bold">0.00</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}