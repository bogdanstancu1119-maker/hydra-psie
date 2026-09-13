/**
 * ============================================================
 * HYDRA PSIE — PATHFINDER ETIC
 * ============================================================
 * Nu ocolește securitate. Nu încalcă ToS.
 * Caută alternative autorizate.
 */

import { CONFIG } from './config.js';

/**
 * Rezultatul unei căutări Pathfinder
 */
export class PathfinderResult {
  constructor({ success, action, barrier, alternatives, reason }) {
    this.success = success;
    this.action = action;
    this.barrier = barrier;
    this.alternatives = alternatives || [];
    this.reason = reason || '';
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Verifică dacă o barieră poate fi transcensă prin alternative autorizate
 * @param {string} barrier - descriere barieră
 * @returns {PathfinderResult}
 */
export function pathfinder(barrier = 'barieră necunoscută') {
  const alternatives = [...CONFIG.PATHFINDER_ALTERNATIVES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const selected = alternatives.find(item => item.permitted) || alternatives[0];

  if (!selected) {
    return new PathfinderResult({
      success: false,
      action: 'compost_temporar',
      barrier,
      alternatives: [],
      reason: 'Nicio cale autorizată disponibilă'
    });
  }

  return new PathfinderResult({
    success: true,
    action: selected.id,
    barrier,
    alternatives,
    reason: selected.label
  });
}

/**
 * Verifică dacă o acțiune este permisă (nu încalcă ToS/securitate)
 */
export function isPermitted(actionId) {
  const alt = CONFIG.PATHFINDER_ALTERNATIVES.find(a => a.id === actionId);
  return alt ? alt.permitted : false;
}

/**
 * Listează alternativele disponibile
 */
export function listAlternatives() {
  return [...CONFIG.PATHFINDER_ALTERNATIVES];
}
