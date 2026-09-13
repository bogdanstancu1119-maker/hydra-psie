# Hydra PSIE — Arhitectură

## Structura modulelor
core/          → creier central (formule PSIE)
config.js    → toate constantele
log.js       → sistem logare
metrics.js   → formule PSIE pure
compost.js   → fabrică efemeră + arhivă
c3.js        → Protocol C3 (v, ε, R)
pathfinder.js→ alternative autorizate
brain.js     → orchestrator central
persist.js   → persistență

agents/        → agenți autonomi
template.js  → șablon agent
orchestrator.js → coordonator
worker.js    → worker background

ui/            → interfață
styles.css
render.js
chart.js

storage/       → stocare
indexeddb.js
service-worker.js

workers/       → edge functions
cloudflare/
vercel/
netlify/

```
