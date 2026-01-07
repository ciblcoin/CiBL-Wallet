// utils/walletAuth.js
export async function linkWalletToUser(publicKey, userId) {
  const supabase = createClient();
  
  // 1. چک کن آیا این wallet قبلاً به کاربر دیگری لینک شده
  const { data: existingLink } = await supabase
    .from('profiles')
    .select('id, auth_id')
    .eq('solana_address', publicKey.toString())
    .single();

  if (existingLink) {
    if (existingLink.auth_id !== userId) {
      throw new Error('این کیف پول قبلاً به کاربر دیگری متصل شده است');
    }
    return existingLink; // قبلاً لینک شده
  }

  // 2. لینک کردن wallet به کاربر فعلی
  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update({
      solana_address: publicKey.toString(),
      updated_at: new Date().toISOString()
    })
    .eq('auth_id', userId)
    .select()
    .single();

  if (error) throw error;
  return updatedProfile;
}

export async function getOrCreateWalletProfile(publicKey) {
  const supabase = createClient();
  
  // کاربر با wallet وارد شده اما Supabase Auth ندارد
  const username = `wallet_${publicKey.toString().slice(0, 8)}`;
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({
      solana_address: publicKey.toString(),
      username: username,
      auth_id: null, // بدون احراز هویت سنتی
      created_at: new Date().toISOString()
    }, {
      onConflict: 'solana_address',
      ignoreDuplicates: false
    })
    .select()
    .single();

  return profile;
}