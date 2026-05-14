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

  if (req.method === 'POST') {
    const { sender, receiver, amount, note, currency } = req.body;
    if (!sender || !receiver || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Deduct balance from sender
    const { data: user } = await supabase
      .from('users')
      .select('balance')
      .eq('wallet_address', sender)
      .single();

    if (!user || user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Update sender balance
    await supabase
      .from('users')
      .update({ balance: user.balance - amount })
      .eq('wallet_address', sender);

    // Save transaction
    const { data: tx, error } = await supabase
      .from('transactions')
      .insert([{ sender, receiver, amount, note, status: 'confirmed' }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ transaction: tx });
  }

  if (req.method === 'GET') {
    const { wallet } = req.query;
    if (!wallet) return res.status(400).json({ error: 'Wallet required' });

    // Global feed — return latest 20 transactions from everyone
    if (wallet === 'global') {
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return res.status(200).json({ transactions: txs || [] });
    }

    // Per user transactions
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .or(`sender.eq.${wallet},receiver.eq.${wallet}`)
      .order('created_at', { ascending: false })
      .limit(20);

    return res.status(200).json({ transactions: txs || [] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}