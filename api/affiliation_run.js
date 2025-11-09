import { runCycle } from '../lib/affiliator_core.js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const provided = url.searchParams.get('secret') || '';
  const expected = (process.env.CRON_SECRET || '').trim();

  // Sécurité : vérifie la clé secrète
  if (expected && provided !== expected) {
    return new Response(
      JSON.stringify({ ok: false, error: 'unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await runCycle();
    return new Response(
      JSON.stringify({ ok: true, ...result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
