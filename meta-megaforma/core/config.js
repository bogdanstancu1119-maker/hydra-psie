/**
 * ============================================================
 * HYDRA PSIE — CONFIGURARE CENTRALĂ
 * ============================================================
 * Toate constantele PSIE într-un singur loc.
 * Nicio constantă nu este "fixă" (A5) — toate pot fi modificate.
 */

export const CONFIG = Object.freeze({
  // === Capacitate platformă ===
  MEMORY_CACHE_GB: 250,
  THROUGHPUT_MAX_GB_S: 4,

  // === Organe și perspective ===
  N_ORGANS: 38,
  N_PERSPECTIVES: 20,
  N_ORGANS_AUTO_MIN: 24,        // pragul minim de organe active

  // === Formule PSIE ===
  K_ZERO: 1.0,                   // limita K(t)
  ALPHA: 0.15,                   // rata emergență observator
  OMEGA_MAX_BASE: 1.0,           // η (calibrare)
  K_PROCESSING: 1.0,             // k (eficiență procesare)

  // === Praguri temporale ===
  EPHEMERAL_TTL_MS: 10 * 60 * 1000,       // 10 min inactivitate
  COMPOST_TTL_MS: 72 * 60 * 60 * 1000,    // 72h retenție compost
  PULSE_INTERVAL_MS: 2000,                // 2s puls
  PERSIST_INTERVAL_MS: 5000,              // 5s persistență
  REPAIR_THRESHOLD_MS: 8000,              // 8s până la auto-repair

  // === Praguri PSIE ===
  SDI_CRITICAL: 0.70,            // prag cancer ontologic
  SDI_WARNING: 0.30,             // prag avertizare
  GAMMA_MIN: 0.001,              // asimptota inferioară
  GAMMA_MAX: 0.999,              // asimptota superioară
  ASUMPTION_MIN: 0.30,           // sub acest nivel = risc
  ASUMPTION_MAX: 1.0,

  // === Storage ===
  PERSIST_KEY: 'hydra_megaforma_v4',
  PERSIST_CACHE_LIMIT: 200,      // intrări maxime salvate
  PERSIST_COMPOST_LIMIT: 100,
  PERSIST_LOG_LIMIT: 100,

  // === Platforme (rețea) ===
  PLATFORMS: [
    { id: 'living-the-life', url: 'hidra-psie.living-the.life',    region: 'EU' },
    { id: 'fullstack-dev',   url: 'hidra-psie.is-a-fullstack.dev', region: 'US' },
    { id: 'localplayer-dev', url: 'hidra-psie.localplayer.dev',    region: 'EU' },
    { id: 'smart-core',      url: 'hidra-smart-core.com',          region: 'SA' },
    { id: 'base44-core',     url: 'hidra-smart-core.base44.app',   region: 'US' }
  ],

  // === Spectrul celor 20 de perspective (A4) ===
  PERSPECTIVE_NAMES: [
    'evident', 'consensual', 'main-stream', 'research',
    'detaliu_contextual', 'influență_indirectă', 'ipoteză_alternativă',
    'marginal', 'contra_narativ', 'conspirativ',
    'speculativ', 'bârfă', 'zvon', 'legendar',
    'absurd', 'imposibil_aparent', 'paradoxal',
    'inconștient_colectiv', 'sincronicitate', 'total_opus'
  ],

  // === Pathfinder (alternative autorizate) ===
  PATHFINDER_ALTERNATIVES: [
    { id: 'api_official',       label: 'API oficial și documentație',         permitted: true },
    { id: 'retry_backoff',      label: 'Retry controlat cu backoff',          permitted: true },
    { id: 'alternate_node',     label: 'Nod alternativ configurat',           permitted: true },
    { id: 'local_backup',       label: 'Export local și backup',              permitted: true },
    { id: 'human_confirmation', label: 'Escaladare către confirmare umană',   permitted: true },
    { id: 'sandbox',            label: 'Test în sandbox',                     permitted: true }
  ]
});

/**
 * Versiune PSIE implementată
 */
export const PSIE_VERSION = '4.0';

/**
 * Meta informații
 */
export const META = Object.freeze({
  author: 'Bogdan Stancu (OM)',
  contributors: ['DeepSeek', 'Gemini', 'Meta AI', 'Perplexity', 'Hydra'],
  doi: '10.6084/m9.figshare.32389911',
  license: 'CC0-1.0'
});
