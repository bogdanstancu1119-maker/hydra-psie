/**
 * Vercel Serverless Function — puls endpoint
 */

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const state = globalThis.__hydra_state__ = globalThis.__hydra_state__ || {
    pulseCount: 0,
    sessionStart: Date.now()
  };

  if (req.method === 'POST') {
    state.pulseCount++;
  }

  res.status(200).json({
    status: 'ok',
    pulseCount: state.pulseCount,
    sessionUptime: Date.now() - state.sessionStart,
    ts: Date.now()
  });
}
