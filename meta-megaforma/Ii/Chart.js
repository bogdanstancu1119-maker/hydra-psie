/**
 * ============================================================
 * HYDRA PSIE — RENDER UI
 * ============================================================
 */

export function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

export function setWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.max(0, Math.min(100, pct)) + '%';
}

export function renderMetrics(brain) {
  const m = brain.metrics;
  const cacheStats = brain.compost.stats();

  setText('mem-used', (cacheStats.cacheUsedGB * 1024).toFixed(3));
  setWidth('mem-bar', cacheStats.cacheUtilization * 100);

  setText('throughput', brain.throughput.currentGBs.toFixed(3));
  setWidth('thr-bar', (brain.throughput.currentGBs / 4) * 100);

  setText('gamma', m.gamma.toFixed(3));
  setWidth('gamma-bar', m.gamma * 100);

  setText('omega-max', m.omegaMax.toFixed(3));
  setWidth('omega-bar', m.omegaMax * 100);

  setText('omega-val', m.omega.toFixed(3));
  setWidth('omega-v-bar', m.omega * 100);

  setText('asumare', m.asumare.toFixed(3));
  setWidth('asumare-bar', m.asumare * 100);

  setText('k-val', m.k.toFixed(3));
  setWidth('k-bar', m.k * 100);

  setText('gamma-div', m.gammaDiv.toFixed(3));
  setWidth('gdiv-bar', m.gammaDiv * 100);

  setText('s-omega', m.sOmega.toFixed(3));
  setWidth('somega-bar', m.sOmega * 100);

  setText('droi-val', m.droi.toFixed(3));
  setWidth('droi-bar', m.droi * 100);

  setText('agents-online', brain.agents.size);
  setText('sdi-val', m.sdi.toFixed(3));
  setText('pf-stat', `${brain.pathfinderSuccess}/${brain.pathfinderAttempts}`);
  setText('last-update', new Date().toLocaleString('ro-RO'));

  // Badges
  const sdiBadge = document.getElementById('sdi-badge');
  if (sdiBadge) {
    sdiBadge.classList.remove('live', 'sync', 'warn', 'err');
    if (m.sdi >= 0.70) sdiBadge.classList.add('err');
    else if (m.sdi >= 0.30) sdiBadge.classList.add('warn');
    else sdiBadge.classList.add('live');
  }

  const gardaBadge = document.getElementById('garda-badge');
  if (gardaBadge) {
    gardaBadge.classList.remove('live', 'sync', 'warn', 'err');
    gardaBadge.classList.add(m.gardaOk ? 'live' : 'warn');
    setText('garda-val', m.gardaOk ? 'ω ≤ Ω_max' : 'Triadă activă');
  }
}

export function renderPerspectives(brain) {
  const grid = document.getElementById('perspectives-grid');
  if (!grid) return;
  grid.innerHTML = brain.perspectives.map(p => {
    let state = 'high';
    if (p.gamma < 0.30) state = 'critical';
    else if (p.gamma < 0.60) state = 'low';
    return `<div class="perspective ${state}">
      <span class="p-name">${escapeHTML(p.name)}</span>
      <span class="p-gamma">${p.gamma.toFixed(3)}</span>
    </div>`;
  }).join('');
}

export function renderAgents(brain) {
  const grid = document.getElementById('agents-grid');
  if (!grid) return;
  const agents = [...brain.agents.values()];
  grid.innerHTML = agents.map(a => `
    <div class="agent">
      <div class="a-name">${escapeHTML(a.platform)}</div>
      <div class="a-meta"><span>${escapeHTML(a.region)}</span><span>γ ${a.gamma.toFixed(3)}</span></div>
      <div class="a-meta"><span>SDI ${a.sdi.toFixed(3)}</span><span>A ${a.asumare.toFixed(3)}</span></div>
    </div>
  `).join('');
  setText('agent-count', agents.length);
}

export function renderOrgans(brain) {
  const grid = document.getElementById('organs-grid');
  if (!grid) return;
  grid.innerHTML = brain.organs.map(o =>
    `<div class="organ ${o.status}">${escapeHTML(o.name)}</div>`
  ).join('');
  setText('organ-count', brain.organs.length);
}

export function renderCompost(brain) {
  const list = document.getElementById('compost-list');
  if (!list) return;
  const entries = [...brain.compost.compost.entries()].slice(-10).reverse();
  if (!entries.length) {
    list.innerHTML = '<div style="color: var(--text-muted);">(gol)</div>';
  } else {
    list.innerHTML = entries.map(([k, v]) =>
      `<div>· ${escapeHTML(k)} → <span style="color: var(--violet);">${escapeHTML(v.pattern.hash)}</span></div>`
    ).join('');
  }
  setText('compost-count', brain.compost.compost.size);
}

export function renderLog(recentEntries) {
  const logEl = document.getElementById('log');
  if (!logEl) return;
  logEl.innerHTML = recentEntries.map(e =>
    `<div class="line"><span class="ts">${escapeHTML(e.ts)}</span><span class="${e.level}">${escapeHTML(e.message)}</span></div>`
  ).join('');
  logEl.scrollTop = logEl.scrollHeight;
}

export function renderAll(brain, logEntries) {
  renderMetrics(brain);
  renderPerspectives(brain);
  renderAgents(brain);
  renderOrgans(brain);
  renderCompost(brain);
  renderLog(logEntries);
}
