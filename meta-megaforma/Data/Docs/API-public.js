```javascript
import { Brain } from './core/brain.js';
import { Orchestrator } from './agents/orchestrator.js';
import { Persistence } from './core/persist.js';

const brain = new Brain();
const orchestrator = new Orchestrator({ brain });

// Puls
brain.pulse();

// Scanare
brain.scanContext();

// Pathfinder
brain.findPath('barieră externă');

// Persistență
Persistence.save(brain);

// Statistici
console.log(brain.stats());
```

Extensibilitate

Adaugă un organ nou:

```javascript
brain.organs.push({
  id: 39,
  name: 'Organ Nou',
  status: 'active',
  lastPulse: Date.now()
});
```

Adaugă o perspectivă nouă:

```javascript
brain.perspectives.push({
  id: 21,
  name: 'perspectivă_nouă',
  gamma: 0.5
});
```
