#!/usr/bin/env node
/**
 * ============================================================
 * HYDRA PSIE — PLATFORM BOOTSTRAP
 * ============================================================
 * Suprapune toate modulele din repository într-o platformă
 * operațională unică. Citește manifestul. Decide ce activează.
 * Pornește totul. Fără dependențe externe.
 *
 * Usage:
 *   node platform-bootstrap.js              # mod auto
 *   node platform-bootstrap.js --mode=standalone
 *   node platform-bootstrap.js --mode=client-only
 *   node platform-bootstrap.js --inspect    # doar diagnostic
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

// ============================================================
// 1. CLI PARSING
// ============================================================
const args = process.argv.slice(2);
const flags = {
  mode: extractFlag('--mode') || null,
  inspect: args.includes('--inspect'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h')
};

function extractFlag(name) {
  const arg = args.find(a => a.startsWith(`${name}=`));
  return arg ? arg.split('=')[1] : null;
}

if (flags.help) {
  console.log(`
Hydra PSIE — Platform Bootstrap

Usage:
  node platform-bootstrap.js [options]

Options:
  --mode=<mode>      Forțează un mod: standalone | edge-assisted | client-only
  --inspect          Doar diagnostic, nu pornește
  --verbose, -v      Output detaliat
  --help, -h         Acest mesaj

Moduri:
  standalone         Server complet autonom (implicit)
  edge-assisted      Server + workers opționale
  client-only        Doar client demo
`);
  process.exit(0);
}

// ============================================================
// 2. LOGGER LOCAL (nu depinde de core/log.js)
// ============================================================
const LOG_COLORS = {
  ok: '\x1b[32m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  err: '\x1b[31m',
  pathfinder: '\x1b[35m',
  dim: '\x1b[90m',
  reset: '\x1b[0m'
};

const BootLog = {
  _ts() { return new Date().toISOString().slice(11, 19); },
  _log(level, msg, meta) {
    const color = LOG_COLORS[level] || LOG_COLORS.info;
    const prefix = `${LOG_COLORS.dim}[${this._ts()}]${LOG_COLORS.reset}`;
    const tag = `${color}[${level.toUpperCase()}]${LOG_COLORS.reset}`;
    console.log(`${prefix} ${tag} ${msg}`);
    if (meta && flags.verbose) console.log('        ', meta);
  },
  ok(m, meta) { this._log('ok', m, meta); },
  info(m, meta) { this._log('info', m, meta); },
  warn(m, meta) { this._log('warn', m, meta); },
  err(m, meta) { this._log('err', m, meta); },
  section(title) {
    console.log('');
    console.log(`${LOG_COLORS.dim}═══════════════════════════════════════════${LOG_COLORS.reset}`);
    console.log(`${LOG_COLORS.info}  ${title}${LOG_COLORS.reset}`);
    console.log(`${LOG_COLORS.dim}═══════════════════════════════════════════${LOG_COLORS.reset}`);
  }
};

// ============================================================
// 3. DISCOVERY — CE EXISTĂ ÎN REPOSITORY
// ============================================================
class RepoDiscovery {
  constructor(root) {
    this.root = root;
    this.modules = new Map();
    this.files = new Map();
  }

  /**
   * Scanează repo-ul și detectează module
   */
  scan() {
    BootLog.info('Scanare repository...');

    // Module esențiale (verificate prin existența folderului)
    const candidates = [
      { name: 'data', path: 'data', priority: 'essential' },
      { name: 'core', path: 'core', priority: 'essential' },
      { name: 'server', path: 'server', priority: 'essential' },
      { name: 'agents', path: 'agents', priority: 'high' },
      { name: 'ui', path: 'ui', priority: 'medium' },
      { name: 'storage', path: 'storage', priority: 'medium' },
      { name: 'deployment', path: 'deployment', priority: 'high' },
      { name: 'scripts', path: 'scripts', priority: 'medium' },
      { name: 'docs', path: 'docs', priority: 'low' },
      { name: 'tests', path: 'tests', priority: 'medium' },
      { name: 'workers', path: 'workers', priority: 'optional' }
    ];

    for (const c of candidates) {
      const fullPath = path.join(this.root, c.path);
      if (fs.existsSync(fullPath)) {
        const files = this._listFiles(fullPath);
        this.modules.set(c.name, {
          ...c,
          files,
          fileCount: files.length,
          exists: true
        });
        BootLog.ok(`Modul detectat: ${c.name} (${files.length} fișiere)`, c);
      } else {
        this.modules.set(c.name, { ...c, exists: false });
        if (c.priority === 'essential') {
          BootLog.warn(`Modul esențial LIPSĂ: ${c.name}`);
        }
      }
    }

    // Fișiere rădăcină
    const rootFiles = [
      'package.json',
      'hydra-manifest.json',
      'index.html',
      'manifest.json',
      'README.md',
      'LICENSE',
      '.env.example'
    ];

    for (const f of rootFiles) {
      const fullPath = path.join(this.root, f);
      this.files.set(f, {
        exists: fs.existsSync(fullPath),
        path: fullPath
      });
    }

    return this;
  }

  _listFiles(dir, maxDepth = 3) {
    const results = [];
    const walk = (current, depth) => {
      if (depth > maxDepth) return;
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue;
        const fullPath = path.join(current, e.name);
        if (e.isDirectory()) {
          walk(fullPath, depth + 1);
        } else {
          results.push(path.relative(this.root, fullPath));
        }
      }
    };
    walk(dir, 0);
    return results;
  }

  hasModule(name) {
    const m = this.modules.get(name);
    return m && m.exists;
  }

  hasFile(name) {
    const f = this.files.get(name);
    return f && f.exists;
  }

  summary() {
    const essential = [...this.modules.values()].filter(m => m.priority === 'essential');
    const present = essential.filter(m => m.exists);
    const missing = essential.filter(m => !m.exists);
    return {
      essentialPresent: present.length,
      essentialMissing: missing.length,
      essentialTotal: essential.length,
      totalModules: [...this.modules.values()].filter(m => m.exists).length,
      missingEssential: missing.map(m => m.name)
    };
  }
}

// ============================================================
// 4. MANIFEST LOADER
// ============================================================
class ManifestLoader {
  constructor(root) {
    this.root = root;
    this.manifest = null;
  }

  load() {
    const manifestPath = path.join(this.root, 'hydra-manifest.json');
    if (!fs.existsSync(manifestPath)) {
      BootLog.warn('hydra-manifest.json lipsă — folosesc defaults');
      this.manifest = this._defaultManifest();
      return this;
    }

    try {
      const raw = fs.readFileSync(manifestPath, 'utf8');
      this.manifest = JSON.parse(raw);
      BootLog.ok(`Manifest încărcat (v${this.manifest.manifest_version})`);
    } catch (e) {
      BootLog.err(`Manifest invalid: ${e.message}`);
      this.manifest = this._defaultManifest();
    }
    return this;
  }

  _defaultManifest() {
    return {
      manifest_version: '1.0.0',
      runtime: { current_mode: 'standalone' },
      modules: {},
      decision_rules: {
        load_all_essential: true,
        load_high_priority: true,
        load_medium_by_default: true,
        load_low_by_default: false
      }
    };
  }

  getMode() {
    return flags.mode || this.manifest.runtime?.current_mode || 'standalone';
  }

  getModulePriority(name) {
    return this.manifest.modules?.[name]?.priority || 'medium';
  }
}

// ============================================================
// 5. PLATFORM COMPOSER — SUPRApunerea
// ============================================================
class PlatformComposer {
  constructor(discovery, manifest) {
    this.discovery = discovery;
    this.manifest = manifest;
    this.composition = {
      mode: manifest.getMode(),
      activeModules: [],
      skippedModules: [],
      services: [],
      capabilities: new Set()
    };
  }

  compose() {
    BootLog.section('Compunere platformă');

    const mode = this.composition.mode;
    BootLog.info(`Mod selectat: ${mode}`);

    // Reguli după mod
    const rules = this._getRulesForMode(mode);
    BootLog.info(`Reguli: essential=${rules.essential}, high=${rules.high}, medium=${rules.medium}, low=${rules.low}, optional=${rules.optional}`);

    // Iterează prin module
    for (const [name, mod] of this.discovery.modules) {
      if (!mod.exists) {
        this.composition.skippedModules.push({ name, reason: 'lipsă' });
        continue;
      }

      const priority = this.manifest.getModulePriority(name);
      const shouldLoad = rules[priority] === true;

      if (shouldLoad) {
        this.composition.activeModules.push({
          name,
          priority,
          path: mod.path,
          fileCount: mod.fileCount
        });
        BootLog.ok(`✓ Activ: ${name} [${priority}]`);
      } else {
        this.composition.skippedModules.push({ name, reason: `priority=${priority}` });
        BootLog.info(`⊘ Skip: ${name} [${priority}]`);
      }
    }

    // Adaugă capabilități
    this._inferCapabilities();

    return this.composition;
  }

  _getRulesForMode(mode) {
    const base = {
      essential: true,
      high: true,
      medium: true,
      low: false,
      optional: false
    };

    if (mode === 'client-only') {
      return {
        essential: true,
        high: false,   // fără server
        medium: true,  // ui + storage
        low: false,
        optional: false
      };
    }

    if (mode === 'edge-assisted') {
      return { ...base, optional: true };
    }

    // standalone (implicit)
    return base;
  }

  _inferCapabilities() {
    const caps = this.composition.capabilities;
    const active = new Set(this.composition.activeModules.map(m => m.name));

    if (active.has('core')) {
      caps.add('brain-psie');
      caps.add('protocol-c3');
      caps.add('pathfinder');
      caps.add('compost');
    }

    if (active.has('server')) {
      caps.add('api-rest');
      caps.add('websocket');
      caps.add('persistence-sqlite');
      caps.add('scheduler');
    }

    if (active.has('agents')) {
      caps.add('agents-autonomous');
      caps.add('coordination-topological');
    }

    if (active.has('ui')) {
      caps.add('interface-visual');
    }

    if (active.has('storage')) {
      caps.add('pwa-offline');
      caps.add('indexeddb');
    }

    if (active.has('deployment')) {
      caps.add('docker-ready');
      caps.add('ssl-auto');
    }
  }

  summary() {
    return {
      mode: this.composition.mode,
      activeModules: this.composition.activeModules.length,
      skippedModules: this.composition.skippedModules.length,
      capabilities: [...this.composition.capabilities],
      modules: this.composition.activeModules.map(m => `${m.name}[${m.priority}]`)
    };
  }
}

// ============================================================
// 6. SERVICE LAUNCHER
// ============================================================
class ServiceLauncher {
  constructor(composition) {
    this.composition = composition;
    this.processes = [];
  }

  async launch() {
    BootLog.section('Lansare servicii');

    const mode = this.composition.mode;
    const active = new Set(this.composition.activeModules.map(m => m.name));

    // Verifică dependențe
    if (mode === 'standalone' && !active.has('server')) {
      BootLog.err('Mod standalone cere modul server — LIPSĂ');
      return false;
    }

    // Lansare server
    if (active.has('server')) {
      const ok = await this._launchServer();
      if (!ok) return false;
    }

    // Lansare client (dacă nu e standalone)
    if (mode === 'client-only' && active.has('core') && active.has('ui')) {
      BootLog.info('Mod client-only — deschide index.html în browser');
      BootLog.info('  python3 -m http.server 8000');
    }

    return true;
  }

  async _launchServer() {
    const serverEntry = path.join(ROOT, 'server', 'index.js');
    if (!fs.existsSync(serverEntry)) {
      BootLog.err(`Server entry lipsă: ${serverEntry}`);
      return false;
    }

    // Verifică node_modules
    const nm = path.join(ROOT, 'node_modules');
    if (!fs.existsSync(nm)) {
      BootLog.warn('node_modules lipsă — rulează `npm install` mai întâi');
      return false;
    }

    BootLog.ok(`Lansare server: ${serverEntry}`);

    const child = spawn('node', [serverEntry], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, HYDRA_BOOTSTRAP: 'true' }
    });

    this.processes.push({ name: 'server', child });

    // Handle graceful shutdown
    child.on('exit', (code) => {
      BootLog.warn(`Server oprit cu cod ${code}`);
    });

    return true;
  }

  stopAll() {
    for (const p of this.processes) {
      try { p.child.kill('SIGTERM'); } catch (e) { /* silent */ }
    }
  }
}

// ============================================================
// 7. DIAGNOSTIC INSPECTOR
// ============================================================
function inspectMode(discovery, manifest, composition) {
  BootLog.section('INSPECT — Diagnostic');

  console.log('');
  console.log('📁 Repository:');
  console.log(`   Root: ${ROOT}`);
  console.log('');

  console.log('📦 Module:');
  for (const [name, mod] of discovery.modules) {
    const status = mod.exists ? '✓' : '✗';
    const fileInfo = mod.exists ? `(${mod.fileCount} fișiere)` : '';
    const priority = manifest.getModulePriority(name);
    console.log(`   ${status} ${name.padEnd(15)} [${priority.padEnd(10)}] ${fileInfo}`);
  }
  console.log('');

  console.log('📄 Fișiere rădăcină:');
  for (const [name, f] of discovery.files) {
    const status = f.exists ? '✓' : '✗';
    console.log(`   ${status} ${name}`);
  }
  console.log('');

  console.log('🎯 Compunere:');
  console.log(`   Mod: ${composition.mode}`);
  console.log(`   Module active: ${composition.activeModules.length}`);
  console.log(`   Module skip: ${composition.skippedModules.length}`);
  console.log('');

  console.log('⚙️  Capabilități:');
  for (const cap of composition.capabilities) {
    console.log(`   • ${cap}`);
  }
  console.log('');

  const summary = discovery.summary();
  console.log('📊 Sumar:');
  console.log(`   Esențiale: ${summary.essentialPresent}/${summary.essentialTotal}`);
  if (summary.essentialMissing > 0) {
    console.log(`   ⚠️  LIPSĂ: ${summary.missingEssential.join(', ')}`);
  }
  console.log('');
}

// ============================================================
// 8. MAIN
// ============================================================
async function main() {
  BootLog.section('HYDRA PSIE — PLATFORM BOOTSTRAP');
  BootLog.info(`Root: ${ROOT}`);
  BootLog.info(`Node: ${process.version}`);
  BootLog.info(`PID: ${process.pid}`);
  console.log('');

  // Discovery
  const discovery = new RepoDiscovery(ROOT).scan();

  // Manifest
  const manifest = new ManifestLoader(ROOT).load();

  // Composition
  const composition = new PlatformComposer(discovery, manifest).compose();

  // Inspect mode
  if (flags.inspect) {
    inspectMode(discovery, manifest, composition);
    return 0;
  }

  // Verificare esențiale
  const summary = discovery.summary();
  if (summary.essentialMissing > 0) {
    BootLog.err(`Module esențiale lipsă: ${summary.missingEssential.join(', ')}`);
    BootLog.info('Rulează cu --inspect pentru diagnostic complet');
    return 1;
  }

  // Summary compunere
  console.log('');
  BootLog.section('Sumar platformă');
  const cSummary = composition.summary();
  console.log(`   Mod: ${cSummary.mode}`);
  console.log(`   Module active: ${cSummary.activeModules}`);
  console.log(`   Module skip: ${cSummary.skippedModules}`);
  console.log(`   Capabilități: ${cSummary.capabilities.length}`);
  console.log('');

  // Launch
  const launcher = new ServiceLauncher(composition);
  const ok = await launcher.launch();

  if (!ok) {
    BootLog.err('Lansare eșuată');
    return 1;
  }

  BootLog.ok('═══════════════════════════════════════════');
  BootLog.ok('  PLATFORMĂ OPERAȚIONALĂ');
  BootLog.ok('  Hydra rulează. Manifestul a fost citit.');
  BootLog.ok('  Zero dependențe externe obligatorii.');
  BootLog.ok('═══════════════════════════════════════════');

  // Graceful shutdown
  const shutdown = () => {
    BootLog.info('Oprire graceful...');
    launcher.stopAll();
    setTimeout(() => process.exit(0), 500);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return 0;
}

// ============================================================
// 9. EXECUȚIE
// ============================================================
main()
  .then((code) => {
    if (flags.inspect) process.exit(code);
    // Dacă rulăm serverul, el blochează — nu ieșim
  })
  .catch((e) => {
    BootLog.err(`FATAL: ${e.message}`);
    if (flags.verbose) console.error(e.stack);
    process.exit(1);
  });
