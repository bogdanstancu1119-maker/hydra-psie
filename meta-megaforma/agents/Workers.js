/**
 * ============================================================
 * HYDRA PSIE — WORKER AUTONOM
 * ============================================================
 * Worker care rulează în background, fără interfață.
 */

import { Orchestrator } from './orchestrator.js';
import { Persistence } from '../core/persist.js';
import { Log } from '../core/log.js';
import { CONFIG } from '../core/config.js';

export class Worker {
  constructor(options = {}) {
    this.orchestrator = options.orchestrator || new Orchestrator();
    this.persistence = options.persistence || Persistence;
    this.intervalMs = options.intervalMs || CONFIG.PULSE_INTERVAL_MS;
    this.running = false;
    this.timer = null;
  }

  start() {
    if (this.running) return;
    this.running = true;

    // Restaurează starea
    this.persistence.restore(this.orchestrator.brain);

    Log.add('ok', 'Worker: pornit.');

    this.timer = setInterval(() => {
      try {
        this.orchestrator.cycle();
        this.persistence.saveThrottled(this.orchestrator.brain);
      } catch (e) {
        Log.add('err', `Worker eroare: ${e.message}`);
      }
    }, this.intervalMs);
  }

  stop() {
    if (!this.running) return;
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.persistence.save(this.orchestrator.brain);
    Log.add('info', 'Worker: oprit.');
  }

  stats() {
    return {
      running: this.running,
      intervalMs: this.intervalMs,
      ...this.orchestrator.stats()
    };
  }
}
