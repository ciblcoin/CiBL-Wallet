'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { JupiterSwapService, POPULAR_TOKENS } from '@/utils/jupiterSwap';
import TokenSelector from './TokenSelector';
import TransactionStatus from './TransactionStatus';
import { SolanaClient } from '@/utils/solanaClient';

export default function SwapInterface() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  
  const [inputToken, setInputToken] = useState(POPULAR_TOKENS[0]); // SOL
  const [outputToken, setOutputToken] = useState(POPULAR_TOKENS[1]); // USDC
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [swapStatus, setSwapStatus] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [slippage, setSlippage] = useState(1); // 1% slippage default

  // Load wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        const balance = await SolanaClient.getBalance(publicKey.toString());
        setWalletBalance(balance);
      }
    };
    fetchBalance();
  }, [publicKey]);

  // Fetch quote when values change
  const fetchQuote = useCallback(async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0 || !publicKey) {
      setQuote(null);
      setOutputAmount('');
      return;
    }

    setLoading(true);
    try {
      const swapService = new JupiterSwapService(connection, { publicKey, signTransaction });
      const result = await swapService.getQuote(
        inputToken.address,
        outputToken.address,
        parseFloat(inputAmount),
        slippage * 100 // Convert percentage to basis points
      );

      if (result.success) {
        setQuote(result);
        setOutputAmount(result.outputAmount.toFixed(6));
      } else {
        setQuote(null);
        setOutputAmount('');
        console.error('Quote error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote(null);
      setOutputAmount('');
    } finally {
      setLoading(false);
    }
  }, [inputAmount, inputToken, outputToken, slippage, connection, publicKey, signTransaction]);

  // Execute swap
  const handleSwap = async () => {
    if (!quote || !publicKey || !signTransaction) {
      setSwapStatus({
        type: 'error',
        message: 'Please connect wallet and get a quote first'
      });
      return;
    }

    setSwapStatus({ type: 'processing', message: 'Preparing transaction...' });
    setLoading(true);

    try {
      const swapService = new JupiterSwapService(connection, { publicKey, signTransaction });
      const result = await swapService.executeSwap(quote.quote);

      if (result.success) {
        setSwapStatus({
          type: 'success',
          message: 'Swap completed successfully!',
          txid: result.txid,
          fee: result.feeInfo
        });
        
        // Update balance
        const newBalance = await SolanaClient.getBalance(publicKey.toString());
        setWalletBalance(newBalance);
        
        // Clear form
        setInputAmount('');
        setOutputAmount('');
        setQuote(null);
      } else {
        setSwapStatus({
          type: 'error',
          message: `Swap failed: ${result.error}`
        });
      }
    } catch (error) {
      setSwapStatus({
        type: 'error',
        message: `Swap error: ${error.message}`
      });
      console.error('Swap execution error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Switch tokens
  const handleSwitchTokens = () => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount(outputAmount);
    setOutputAmount(inputAmount);
    setQuote(null);
  };

  // Set amount by percentage of balance
  const setAmountByPercentage = (percentage) => {
    if (walletBalance > 0) {
      const amount = (walletBalance * percentage / 100).toFixed(4);
      setInputAmount(amount);
    }
  };

  return (
    <div className="max-w-md mx-auto wallet-card">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
          Swap Tokens
        </h2>
        <p className="text-slate-400 mt-2">
          Best rates via Jupiter Aggregator
        </p>
      </div>

      {/* Display transaction status */}
      {swapStatus && <TransactionStatus status={swapStatus} />}

      {/* FROM section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-300">From</label>
          <div className="text-sm text-slate-400">
            Balance: <span className="text-blue-300 font-medium">{walletBalance.toFixed(4)} SOL</span>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="number"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-lg text-white text-xl placeholder-slate-500 focus:outline-none focus:border-blue-500"
              min="0"
              step="any"
            />
          </div>
          <div className="w-32">
            <TokenSelector
              selectedToken={inputToken}
              onSelect={setInputToken}
              label=""
              excludeToken={outputToken}
            />
          </div>
        </div>

        {/* Quick percentage buttons */}
        <div className="flex space-x-2 mt-3">
          {[25, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              type="button"
              onClick={() => setAmountByPercentage(percent)}
              className="flex-1 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            >
              {percent}%
            </button>
          ))}
        </div>
      </div>

      {/* Switch tokens button */}
      <div className="flex justify-center my-2">
        <button
          type="button"
          onClick={handleSwitchTokens}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-600 transition-colors"
        >
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* TO section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-300">To</label>
          <div className="text-sm text-slate-400">
            Estimated
          </div>
        </div>
        
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={outputAmount || '0.0'}
              readOnly
              className="w-full p-3 bg-slate-900 border border-blue-500/30 rounded-lg text-white text-xl placeholder-slate-500 focus:outline-none focus:border-blue-500 opacity-80"
            />
          </div>
          <div className="w-32">
            <TokenSelector
              selectedToken={outputToken}
              onSelect={setOutputToken}
              label=""
              excludeToken={inputToken}
            />
          </div>
        </div>
      </div>

      {/* Slippage settings */}
      <div className="mb-6 p-3 bg-slate-800/50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-300">Slippage Tolerance</label>
          <span className="text-blue-300 font-medium">{slippage}%</span>
        </div>
        <div className="flex space-x-2">
          {[0.5, 1, 2, 3].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSlippage(value)}
              className={`flex-1 py-1.5 text-sm rounded transition-colors ${
                slippage === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {value}%
            </button>
          ))}
          <div className="relative flex-1">
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value) || 1)}
              className="w-full p-1.5 bg-slate-700 text-center text-sm text-white rounded border border-slate-600 focus:outline-none focus:border-blue-500"
              min="0.1"
              max="100"
              step="0.1"
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-slate-400">%</span>
          </div>
        </div>
      </div>

      {/* Swap details */}
      {quote && (
        <div className="mb-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
          <h3 className="font-medium text-slate-300 mb-2">Swap Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Rate</span>
              <span className="text-white">
                1 {inputToken.symbol} = {(quote.outputAmount / quote.inputAmount).toFixed(6)} {outputToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Minimum Received</span>
              <span className="text-white">
                {(quote.outputAmount * (1 - slippage/100)).toFixed(6)} {outputToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Price Impact</span>
              <span className="text-green-400">
                {quote.quote.priceImpactPct ? `${(quote.quote.priceImpactPct * 100).toFixed(2)}%` : '< 0.01%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Jupiter Fee</span>
              <span className="text-slate-300">0.1%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CiBL Service Fee</span>
              <span className="text-yellow-300">
                {(quote.estimatedFee.percentage * 100).toFixed(2)}% (≈ ${(quote.estimatedFee.amountInSol * 150).toFixed(2)})
              </span>
            </div>
            <div className="pt-2 border-t border-slate-700">
              <div className="flex justify-between font-medium">
                <span className="text-slate-300">Total Fee</span>
                <span className="text-white">
                  {((quote.estimatedFee.percentage + 0.001) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execute button */}
      <button
        onClick={handleSwap}
        disabled={loading || !quote || !inputAmount || parseFloat(inputAmount) <= 0 || !publicKey}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : !publicKey ? (
          'Connect Wallet to Swap'
        ) : !inputAmount ? (
          'Enter Amount'
        ) : parseFloat(inputAmount) > walletBalance ? (
          'Insufficient Balance'
        ) : (
          `Swap ${inputAmount} ${inputToken.symbol} for ${outputAmount} ${outputToken.symbol}`
        )}
      </button>

      <p className="text-xs text-center text-slate-500 mt-4">
        By swapping, you agree to our Terms and acknowledge the fees.
      </p>
    </div>
  );
}