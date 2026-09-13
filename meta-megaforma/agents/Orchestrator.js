/**
 * ============================================================
 * HYDRA PSIE — ORCHESTRATOR AGENȚI
 * ============================================================
 * Coordonează toți agenții prin creierul central (Legea 566).
 */

import { Agent } from './template.js';
import { Brain } from '../core/brain.js';
import { Log } from '../core/log.js';
import { CONFIG } from '../core/config.js';

export class Orchestrator {
  constructor(options = {}) {
    this.brain = options.brain || new Brain();
    this.agents = new Map();
    this.cycleCount = 0;

    // Creează automat un agent pentru fiecare platformă
    for (const platform of CONFIG.PLATFORMS) {
      this.addAgent({
        id: platform.id,
        platform: platform.url,
        region: platform.region
      });
    }
  }

  addAgent(config) {
    const agent = new Agent({ ...config, brain: this.brain });
    this.agents.set(agent.id, agent);
    Log.add('info', `Orchestrator: agent adăugat — ${agent.id}`);
    return agent;
  }

  removeAgent(id) {
    const removed = this.agents.delete(id);
    if (removed) Log.add('info', `Orchestrator: agent eliminat — ${id}`);
    return removed;
  }

  /**
   * Rulează un ciclu pentru toți agenții
   */
  cycle() {
    this.cycleCount++;
    const results = [];

    for (const agent of this.agents.values()) {
      results.push(agent.cycle());
    }

    return {
      cycle: this.cycleCount,
      agentCount: this.agents.size,
      results
    };
  }

  /**
   * Calculează D_roi (coordonare topologică)
   */
  getDroi() {
    return this.brain.metrics.droi;
  }

  stats() {
    return {
      orchestrator: {
        cycleCount: this.cycleCount,
        agentCount: this.agents.size
      },
      brain: this.brain.stats(),
      agents: [...this.agents.values()].map(a => a.stats())
    };
  }
}
