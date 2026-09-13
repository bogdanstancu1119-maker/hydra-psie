/**
 * ============================================================
 * HYDRA PSIE — PROTOCOL C3
 * ============================================================
 * Orice valoare circulă cu (v, ε, R).
 * Niciodată goală.
 */

/**
 * Valoare declarată cu toleranță și rezoluție
 */
export class DeclaredValue {
  constructor(value, epsilon = 1e-3, resolution = 'demo-local', source = 'Hydra') {
    this.value = Number(value);
    this.epsilon = Number(epsilon);
    this.resolution = String(resolution);
    this.source = String(source);
    this.timestamp = new Date().toISOString();
    this.validate();
  }

  validate() {
    if (!Number.isFinite(this.value)) {
      throw new Error('DeclaredValue.value trebuie finit.');
    }
    if (!Number.isFinite(this.epsilon) || this.epsilon <= 0) {
      throw new Error('DeclaredValue.epsilon trebuie > 0.');
    }
    if (!this.resolution.trim()) {
      throw new Error('DeclaredValue.resolution nu poate fi gol.');
    }
  }

  toJSON() {
    return {
      value: this.value,
      epsilon: this.epsilon,
      resolution: this.resolution,
      source: this.source,
      timestamp: this.timestamp
    };
  }

  toString() {
    return `DeclaredValue(v=${this.value.toFixed(4)}, ε=${this.epsilon.toExponential(2)}, R=${this.resolution})`;
  }
}

/**
 * Verifică dacă observatorul declară "1" la propriul prag
 */
export function sameClaimOfOne(dv) {
  return Math.abs(1 - dv.value) < dv.epsilon;
}

/**
 * Acord real (Legea 496)
 */
export function agreeReal(a, b) {
  return Math.abs(a.value - b.value) < Math.max(a.epsilon, b.epsilon);
}

/**
 * Acord fals (M4)
 */
export function falseAgreement(a, b) {
  const bothOne = sameClaimOfOne(a) && sameClaimOfOne(b);
  const differsAtFine = Math.abs(a.value - b.value) >= Math.min(a.epsilon, b.epsilon);
  return bothOne && differsAtFine;
}

/**
 * Compară două valori declarate
 * @returns {'acord_real' | 'acord_fals' | 'dezacord'}
 */
export function compareDeclaredValues(a, b) {
  if (falseAgreement(a, b)) return 'acord_fals';
  if (agreeReal(a, b)) return 'acord_real';
  return 'dezacord';
}

/**
 * Agregare ponderată robustă (Legea 499)
 */
export function aggregateDeclaredValues(values, weights) {
  if (!values.length) return null;
  if (values.length !== weights.length) {
    throw new Error('Număr diferit de valori și ponderi.');
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight <= 0) return null;

  let weightedValue = 0;
  let minEpsilon = Infinity;
  let maxEpsilon = 0;

  for (let i = 0; i < values.length; i++) {
    weightedValue += (values[i].value * weights[i]) / totalWeight;
    minEpsilon = Math.min(minEpsilon, values[i].epsilon);
    maxEpsilon = Math.max(maxEpsilon, values[i].epsilon);
  }

  return new DeclaredValue(
    weightedValue,
    maxEpsilon,
    'agregare-ponderată-c3',
    'Hydra'
  );
}

/**
 * Verifică dacă două valori pot fi comparate
 */
export function canCompare(a, b) {
  try {
    a.validate();
    b.validate();
    return true;
  } catch {
    return false;
  }
                      }
