import { supabase } from '@/lib/supabase/client';
import { connection } from '@/utils/solanaClient'; // از پروژه موجود

export async function executeTradeChallenge(challengeId, userType) {
  // 1. دریافت اطلاعات چالش
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();
  
  if (!challenge) throw new Error('Challenge not found');
  
  // 2. اجرای معامله روی Solana (با Jupiter API)
  const tradeResult = await executeJupiterSwap({
    inputMint: getMintAddress(challenge.currency_pair.split('/')[0]),
    outputMint: getMintAddress(challenge.currency_pair.split('/')[1]),
    amount: challenge.amount,
    slippage: 0.5 // 0.5%
  });
  
  // 3. ذخیره نتیجه
  if (userType === 'creator') {
    await supabase
      .from('challenges')
      .update({ creator_tx_signature: tradeResult.signature })
      .eq('id', challengeId);
  } else {
    await supabase
      .from('challenges')
      .update({ acceptor_tx_signature: tradeResult.signature })
      .eq('id', challengeId);
  }
  
  return tradeResult;
}

export async function calculateChallengeWinner(challengeId) {
  // محاسبه برنده بر اساس PnL
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();
  
  if (challenge.creator_pnl > challenge.acceptor_pnl) {
    return challenge.creator_id;
  } else if (challenge.acceptor_pnl < challenge.creator_pnl) {
    return challenge.acceptor_id;
  } else {
    // مساوی - یا قرعه‌کشی یا تقسیم جایزه
    return null;
  }
}