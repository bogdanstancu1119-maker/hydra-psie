/**
 * ============================================================
 * HYDRA PSIE — FABRICA EFEMERĂ + ARHIVA COMPOST
 * ============================================================
 * Legea 500 — Arhiva Compost: nimic nu se pierde
 * Legea 532 — Distilare Compost: pattern extraction
 * Fabrica efemeră: 10 min de la ultima utilizare
 */

import { CONFIG } from './config.js';

/**
 * Hash simplu pentru identificare pattern
 */
export function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).slice(0, 8);
}

/**
 * Extrage pattern reutilizabil din date
 */
export function extractPattern(data) {
  const str = JSON.stringify(data);
  return {
    type: 'composted_pattern',
    keys: Object.keys(data || {}).slice(0, 5),
    summary: str.slice(0, 80),
    hash: simpleHash(str)
  };
}

/**
 * Manager Compost + Cache efemer
 */
export class CompostManager {
  constructor(maxCacheGB = CONFIG.MEMORY_CACHE_GB) {
    this.maxCacheGB = maxCacheGB;
    this.usedGB = 0;
    this.cache = new Map();     // id -> entry
    this.compost = new Map();   // id -> archived pattern
    this.onEvent = null;        // callback(event)
  }

  /**
   * Emite un eveniment intern
   */
  _emit(type, payload) {
    if (this.onEvent) {
      try { this.onEvent({ type, payload, ts: Date.now() }); } catch (e) { /* silent */ }
    }
  }

  /**
   * Adaugă o intrare în cache
   * @returns {number} sizeGB efectiv
   */
  cacheEntry(id, data, gamma = 0.5, epsilon = 1e-3, resolution = 'default') {
    let sizeGB = 0;
    try {
      sizeGB = new Blob([JSON.stringify(data)]).size / (1024 ** 3);
    } catch (e) {
      sizeGB = JSON.stringify(data).length / (1024 ** 3);
    }
    if (sizeGB <= 0) sizeGB = 1e-9;

    // Verifică capacitate
    if (this.usedGB + sizeGB > this.maxCacheGB) {
      this.recycleOldest(sizeGB);
    }

    // Dacă există, eliberează
    const existing = this.cache.get(id);
    if (existing) {
      this.usedGB = Math.max(0, this.usedGB - existing.sizeGB);
    }

    this.cache.set(id, {
      data,
      gamma,
      epsilon,
      resolution,
      ts: Date.now(),
      lastUse: Date.now(),
      sizeGB
    });

    this.usedGB = Math.max(0, this.usedGB + sizeGB);
    this._emit('cache_add', { id, sizeGB });

    return sizeGB;
  }

  /**
   * Marchează intrare ca folosită (resetează TTL)
   */
  touch(id) {
    const entry = this.cache.get(id);
    if (entry) entry.lastUse = Date.now();
  }

  /**
   * Verifică dacă există intrare
   */
  has(id) {
    return this.cache.has(id);
  }

  /**
   * Returnează datele unei intrări
   */
  get(id) {
    const entry = this.cache.get(id);
    return entry ? entry.data : null;
  }

  /**
   * Reciclează cele mai vechi când se atinge capacitatea
   */
  recycleOldest(neededGB) {
    const ordered = [...this.cache.entries()]
      .sort((a, b) => a[1].lastUse - b[1].lastUse);

    let freedGB = 0;

    for (const [id, entry] of ordered) {
      if (freedGB >= neededGB) break;

      this.addToCompost(id, entry.data);
      this.cache.delete(id);
      this.usedGB = Math.max(0, this.usedGB - entry.sizeGB);
      freedGB += entry.sizeGB;

      this._emit('recycled', { id, sizeGB: entry.sizeGB, reason: 'capacity' });
    }

    return freedGB;
  }

  /**
   * Reciclează intrările expirate (>10 min inactivitate)
   */
  recycleExpired() {
    const now = Date.now();
    let recycled = 0;

    for (const [id, entry] of [...this.cache.entries()]) {
      if (now - entry.lastUse > CONFIG.EPHEMERAL_TTL_MS) {
        this.addToCompost(id, entry.data);
        this.usedGB = Math.max(0, this.usedGB - entry.sizeGB);
        this.cache.delete(id);
        recycled++;
        this._emit('expired', { id, sizeGB: entry.sizeGB });
      }
    }

    return recycled;
  }

  /**
   * Reciclează manual un procent din cache
   */
  recycleManual(percent = 0.25) {
    const entries = [...this.cache.entries()]
      .sort((a, b) => a[1].lastUse - b[1].lastUse);

    if (!entries.length) return 0;

    const count = Math.max(1, Math.ceil(entries.length * percent));

    for (const [id, entry] of entries.slice(0, count)) {
      this.addToCompost(id, entry.data);
      this.cache.delete(id);
      this.usedGB = Math.max(0, this.usedGB - entry.sizeGB);
    }

    this._emit('manual_recycle', { count });
    return count;
  }

  /**
   * Adaugă pattern în Compost
   */
  addToCompost(id, data) {
    this.compost.set(id, {
      pattern: extractPattern(data),
      original: id,
      ts: Date.now()
    });
  }

  /**
   * Recuperează pattern din Compost
   */
  recover(id) {
    const archived = this.compost.get(id);
    if (!archived) return null;

    const recovered = {
      recoveredFrom: archived.original,
      pattern: archived.pattern,
      recoveredAt: new Date().toISOString(),
      purpose: 're-ancorare contextuală'
    };

    const newId = `recovered_${id}_${Date.now()}`;
    this.cacheEntry(newId, recovered, 0.65, 1e-3, 'compost-recovery');
    this.compost.delete(id);

    this._emit('recovered', { original: id, newId });

    return { newId, recovered };
  }

  /**
   * Curăță Compost >72h
   */
  cleanExpired() {
    const cutoff = Date.now() - CONFIG.COMPOST_TTL_MS;
    let removed = 0;

    for (const [id, entry] of [...this.compost.entries()]) {
      if (entry.ts < cutoff) {
        this.compost.delete(id);
        removed++;
      }
    }

    if (removed > 0) this._emit('compost_cleaned', { removed });
    return removed;
  }

  /**
   * Statistici
   */
  stats() {
    return {
      cacheCount: this.cache.size,
      cacheUsedGB: this.usedGB,
      cacheCapacityGB: this.maxCacheGB,
      cacheUtilization: this.usedGB / this.maxCacheGB,
      compostCount: this.compost.size,
      oldestCacheAge: this.cache.size > 0
        ? Date.now() - Math.min(...[...this.cache.values()].map(e => e.ts))
        : 0,
      newestCompost: this.compost.size > 0
        ? Math.max(...[...this.compost.values()].map(e => e.ts))
        : 0
    };
  }

  /**
   * Serializare pentru persistență
   */
  serialize() {
    return {
      usedGB: this.usedGB,
      entries: [...this.cache.entries()].slice(-CONFIG.PERSIST_CACHE_LIMIT),
      compost: [...this.compost.entries()].slice(-CONFIG.PERSIST_COMPOST_LIMIT)
    };
  }

  /**
   * Restaurare din persistență
   */
  deserialize(data) {
    if (!data) return;
    this.usedGB = data.usedGB || 0;
    this.cache = new Map(data.entries || []);
    this.compost = new Map(data.compost || []);
  }
}
