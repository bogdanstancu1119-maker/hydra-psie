/**
 * ============================================================
 * HYDRA PSIE — SISTEM DE LOGARE
 * ============================================================
 * Log circular cu nivel de severitate. Nu aruncă erori.
 * Toate evenimentele sunt urmăribile.
 */

export const LOG_LEVELS = ['ok', 'info', 'warn', 'err', 'pathfinder'];

export class LogSystem {
  constructor(maxSize = 200) {
    this.maxSize = maxSize;
    this.entries = [];
    this.subscribers = new Set();
  }

  /**
   * Adaugă o intrare în log
   */
  add(level, message) {
    const safeLevel = LOG_LEVELS.includes(level) ? level : 'info';
    const entry = {
      ts: new Date().toLocaleTimeString('ro-RO'),
      tsISO: new Date().toISOString(),
      level: safeLevel,
      message: String(message)
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxSize) this.entries.shift();

    // Notifică abonații
    for (const cb of this.subscribers) {
      try { cb(entry); } catch (e) { /* silent */ }
    }

    return entry;
  }

  /**
   * Returnează ultimele N intrări
   */
  recent(n = 50) {
    return this.entries.slice(-n);
  }

  /**
   * Filtrează după nivel
   */
  filterByLevel(level) {
    return this.entries.filter(e => e.level === level);
  }

  /**
   * Abonează o funcție la evenimente noi
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Curăță log
   */
  clear() {
    this.entries = [];
  }

  /**
   * Statistici
   */
  stats() {
    const counts = {};
    for (const lvl of LOG_LEVELS) counts[lvl] = 0;
    for (const e of this.entries) counts[e.level]++;
    return { total: this.entries.length, counts };
  }
}

// Instanță globală (singleton)
export const Log = new LogSystem();
