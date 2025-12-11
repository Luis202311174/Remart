export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};

  const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
  if (!ADMIN_SECRET) {
    return res.status(500).json({ error: 'ADMIN_SECRET not configured on server' });
  }

  if (!password) return res.status(400).json({ error: 'Missing password' });

  if (password === ADMIN_SECRET) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: 'Invalid password' });
}