'use server'
import { createClient } from '@/lib/supabase/server'

export async function upsertProfile(userId, solanaAddress = null, email = null, username = null) {
  const supabase = createClient()
  
  // Generate default username if not provided
  const finalUsername = username || user_${Math.random().toString(36).slice(2, 8)}
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        auth_id: userId,
        solana_address: solanaAddress,
        email: email,
        username: finalUsername,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'auth_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}