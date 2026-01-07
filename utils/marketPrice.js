// utils/marketPrice.js
async function getCurrentMarketPrice(pair) {
  try {
    const [base, quote] = pair.split('/');
    
    // استفاده از Jupiter API برای قیمت SOL
    if (base === 'SOL') {
      const response = await fetch(
        `https://api.jup.ag/price/v2?ids=SOL&vsToken=${quote === 'USDC' ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' : '...'}`
      );
      const data = await response.json();
      return data.data.SOL?.price || 0;
    }
    
    // یا استفاده از CoinGecko API
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`
    );
    const data = await response.json();
    return data.solana.usd;
    
  } catch (error) {
    console.error('Failed to fetch market price:', error);
    return 0;
  }
}