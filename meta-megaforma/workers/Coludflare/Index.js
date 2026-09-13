/**
 * ============================================================
 * HYDRA PSIE — CLOUDFLARE WORKER
 * ============================================================
 * Edge function care menține starea Hydra.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    try {
      if (path === '/') {
        return json({ status: 'ok', version: env.PSIE_VERSION || '4.0', ts: Date.now() }, cors);
      }

      if (path === '/state' && request.method === 'GET') {
        const state = await env.HYDRA_STATE.get('brain_state');
        return json(state ? JSON.parse(state) : { empty: true }, cors);
      }

      if (path === '/state' && request.method === 'POST') {
        const body = await request.json();
        await env.HYDRA_STATE.put('brain_state', JSON.stringify(body));
        return json({ saved: true, ts: Date.now() }, cors);
      }

      if (path === '/pulse' && request.method === 'POST') {
        const count = parseInt(await env.HYDRA_STATE.get('pulse_count') || '0') + 1;
        await env.HYDRA_STATE.put('pulse_count', String(count));
        return json({ pulse: count, ts: Date.now() }, cors);
      }

      return json({ error: 'not found' }, cors, 404);
    } catch (e) {
      return json({ error: e.message }, cors, 500);
    }
  }
};

function json(data, cors, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors }
  });
}
