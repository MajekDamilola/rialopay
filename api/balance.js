import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { wallet } = req.query;
    if (!wallet) return res.status(400).json({ error: 'Wallet required' });

    const { data: user } = await supabase
      .from('users')
      .select('balance')
      .eq('wallet_address', wallet)
      .single();

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json({ balance: user.balance });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}