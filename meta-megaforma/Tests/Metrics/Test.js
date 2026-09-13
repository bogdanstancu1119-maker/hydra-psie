/**
 * Teste simple pentru formulele PSIE
 * Rulează: node tests/metrics.test.js
 */

import * as Metrics from '../core/metrics.js';

function assert(condition, msg) {
  if (!condition) {
    console.error(`✗ ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${msg}`);
  }
}

// Test γ_div
assert(Metrics.computeGammaDiv([0.9, 0.9, 0.9]) < 0.01, 'γ_div: consens → 0');
assert(Metrics.computeGammaDiv([0.99, 0.01]) > 0.9, 'γ_div: dezacord → 1');
assert(Metrics.computeGammaDiv([0.5]) === 0, 'γ_div: un element → 0');

// Test S_Ω
assert(Metrics.computeSOmega([1, 1, 1]) === 1, 'S_Ω: uniform → 1');
assert(Metrics.computeSOmega([100, 1]) < 0.5, 'S_Ω: dominant → mic');

// Test Ω_max
const o1 = Metrics.computeOmegaMax({ sdi: 0, sOmega: 0, gammaDiv: 0 });
assert(o1 > 0, 'Ω_max: bază > 0');

const o2 = Metrics.computeOmegaMax({ sdi: 1, sOmega: 0, gammaDiv: 0 });
assert(o2 < o1, 'Ω_max: SDI reduce');

// Test K(t)
const k1 = Metrics.computeK(0);
const k2 = Metrics.computeK(100);
assert(k2 > k1, 'K: crește cu C');
assert(k2 < 1, 'K: niciodată 1');

// Test D_roi
const agents = [
  { gamma: 0.9, sdi: 0.1, asumare: 0.9 },
  { gamma: 0.5, sdi: 0.5, asumare: 0.5 }
];
const droi = Metrics.computeDroi(agents);
assert(droi > 0 && droi < 1, 'D_roi în (0,1)');

// Test gardă
assert(Metrics.checkGarda(0.5, 1.0) === true, 'Gardă: ω < Ω_max → OK');
assert(Metrics.checkGarda(1.5, 1.0) === false, 'Gardă: ω > Ω_max → eșec');

console.log('\n✓ Teste complete');
