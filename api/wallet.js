import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { wallet_address } = req.body || {};

  if (req.method === 'POST') {
    if (!wallet_address) return res.status(400).json({ error: 'Wallet address required' });

    // Check if user exists
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single();

    // Create user if doesn't exist
    if (!user) {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ wallet_address, balance: 1000 }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      user = newUser;
    }

    return res.status(200).json({ user });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}