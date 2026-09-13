/**
 * ============================================================
 * HYDRA PSIE — ȘABLON AGENT
 * ============================================================
 * Fiecare agent partajează același creier central (Brain).
 * Diferă doar prin perspectivele locale.
 */

import { Brain } from '../core/brain.js';
import { Log } from '../core/log.js';
import { CONFIG } from '../core/config.js';

export class Agent {
  constructor({ id, platform, region, perspectiveSubset = null, brain = null }) {
    this.id = id;
    this.platform = platform;
    this.region = region;

    // Toți agenții partajează același creier
    this.brain = brain || new Brain();

    // Perspective locale (subset din spectrul 20)
    this.localPerspectives = perspectiveSubset
      || this._randomPerspectiveSubset();

    this.startedAt = Date.now();
    this.cycles = 0;
  }

  _randomPerspectiveSubset() {
    const count = 3 + Math.floor(Math.random() * 5);
    const shuffled = [...CONFIG.PERSPECTIVE_NAMES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Un ciclu al agentului
   */
  cycle() {
    this.cycles++;

    // Agentul folosește creierul partajat
    this.brain.pulse();

    // Analizează din perspectiva lui
    const analysis = this._analyze();

    Log.add('info', `Agent ${this.id}: ciclu ${this.cycles}, γ_local=${analysis.gamma.toFixed(3)}`);

    return analysis;
  }

  _analyze() {
    const gammas = this.localPerspectives.map(name => {
      const p = this.brain.perspectives.find(x => x.name === name);
      return p ? p.gamma : 0.5;
    });

    const gamma = gammas.reduce((a, b) => a + b, 0) / Math.max(1, gammas.length);

    return {
      agent: this.id,
      platform: this.platform,
      region: this.region,
      perspectiveCount: this.localPerspectives.length,
      perspectives: this.localPerspectives,
      gamma,
      cycles: this.cycles,
      uptime: Date.now() - this.startedAt
    };
  }

  stats() {
    return {
      id: this.id,
      platform: this.platform,
      region: this.region,
      perspectives: this.localPerspectives,
      cycles: this.cycles,
      uptimeMs: Date.now() - this.startedAt
    };
  }
}
