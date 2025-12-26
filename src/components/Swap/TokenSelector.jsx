'use client';

import { useState, useEffect } from 'react';
import { POPULAR_TOKENS } from '@/utils/jupiterSwap';
import Image from 'next/image';

export default function TokenSelector({ 
  selectedToken, 
  onSelect, 
  label, 
  disabled = false,
  excludeToken = null 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const filteredTokens = POPULAR_TOKENS.filter(
    token => !excludeToken || token.address !== excludeToken.address
  );

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    // For simplicity, filtering local tokens
    // In production, you would call Jupiter token search API
    const results = filteredTokens.filter(token =>
      token.symbol.toLowerCase().includes(query.toLowerCase()) ||
      token.name.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(results.slice(0, 10));
    setLoading(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.token-selector-container')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative token-selector-container">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full p-3 bg-slate-800 border border-blue-500/30 rounded-lg flex items-center justify-between hover:border-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center space-x-3">
          {selectedToken.logoURI ? (
            <div className="relative w-8 h-8">
              <Image
                src={selectedToken.logoURI}
                alt={selectedToken.symbol}
                fill
                className="rounded-full"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = 
                    `<div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">${selectedToken.symbol.charAt(0)}</div>`;
                }}
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {selectedToken.symbol.charAt(0)}
            </div>
          )}
          <div className="text-left">
            <div className="font-medium text-white">{selectedToken.symbol}</div>
            <div className="text-xs text-slate-400">{selectedToken.name}</div>
          </div>
        </div>
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-blue-500/30 rounded-lg shadow-lg max-h-96 overflow-auto">
          {/* Search input */}
          <div className="p-3 border-b border-slate-700">
            <input
              type="text"
              placeholder="Search token name or symbol..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full p-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="py-2">
            {loading ? (
              <div className="p-4 text-center text-slate-400">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className="ml-2">Searching...</span>
              </div>
            ) : searchQuery && searchResults.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No tokens found
              </div>
            ) : (
              <>
                {/* Popular tokens section */}
                {!searchQuery && (
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Popular Tokens
                  </div>
                )}
                
                {(searchQuery ? searchResults : filteredTokens).map((token) => (
                  <button
                    key={token.address}
                    type="button"
                    onClick={() => {
                      onSelect(token);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-slate-800 transition-colors"
                  >
                    {token.logoURI ? (
                      <div className="relative w-8 h-8">
                        <Image
                          src={token.logoURI}
                          alt={token.symbol}
                          fill
                          className="rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {token.symbol.charAt(0)}
                      </div>
                    )}
                    <div className="text-left flex-1">
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-xs text-slate-400 truncate">{token.name}</div>
                    </div>
                    {token.balance && (
                      <div className="text-sm text-slate-400">
                        {token.balance.toFixed(4)}
                      </div>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}