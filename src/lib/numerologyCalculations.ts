/**
 * Pythagorean Numerology Calculations for Becoming
 * 
 * This system provides background signals for:
 * - Personalized guidance
 * - Pacing and pressure tuning
 * - Mentor routing
 * - Action acceleration
 * 
 * All interpretations are grounded, non-mystical, and non-deterministic.
 */

// Pythagorean letter values
const LETTER_VALUES: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);

// Master numbers to preserve
const MASTER_NUMBERS = new Set([11, 22, 33]);

/**
 * Normalize name according to rules:
 * - Trim whitespace
 * - Convert to uppercase
 * - Remove diacritics (Unicode NFD)
 * - Remove punctuation
 * - Keep only A-Z and spaces
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^A-Z\s]/g, ''); // Keep only A-Z and spaces
}

/**
 * Reduce a number to single digit, preserving master numbers (11, 22, 33)
 */
export function reduceNumber(num: number, preserveMasters = true): number {
  if (preserveMasters && MASTER_NUMBERS.has(num)) {
    return num;
  }
  
  while (num > 9 && !(preserveMasters && MASTER_NUMBERS.has(num))) {
    num = String(num).split('').reduce((sum, digit) => sum + parseInt(digit), 0);
  }
  
  return num;
}

/**
 * Calculate Life Path Number from date of birth
 * Primary signal for the system
 */
export function calculateLifePath(birthDate: string): number {
  // Parse date (expects YYYY-MM-DD or DD/MM/YYYY)
  let day: number, month: number, year: number;
  
  if (birthDate.includes('-')) {
    const [y, m, d] = birthDate.split('-').map(Number);
    year = y; month = m; day = d;
  } else if (birthDate.includes('/')) {
    const [d, m, y] = birthDate.split('/').map(Number);
    year = y; month = m; day = d;
  } else {
    throw new Error('Invalid date format');
  }
  
  // Reduce each component
  const reducedDay = reduceNumber(day, false);
  const reducedMonth = reduceNumber(month, false);
  const reducedYear = reduceNumber(year, false);
  
  // Sum and reduce (preserve masters)
  const sum = reducedDay + reducedMonth + reducedYear;
  return reduceNumber(sum, true);
}

/**
 * Calculate Expression Number from full name
 * Sum of all letter values
 */
export function calculateExpressionNumber(fullName: string): number {
  const normalized = normalizeName(fullName);
  
  let sum = 0;
  for (const char of normalized) {
    if (LETTER_VALUES[char]) {
      sum += LETTER_VALUES[char];
    }
  }
  
  return reduceNumber(sum, true);
}

/**
 * Calculate Soul Urge (Inner Drive) from vowels only
 */
export function calculateSoulUrge(fullName: string): number {
  const normalized = normalizeName(fullName);
  
  let sum = 0;
  for (const char of normalized) {
    if (VOWELS.has(char) && LETTER_VALUES[char]) {
      sum += LETTER_VALUES[char];
    }
  }
  
  return reduceNumber(sum, true);
}

/**
 * Calculate Personality/Dream Number from consonants only
 */
export function calculatePersonalityNumber(fullName: string): number {
  const normalized = normalizeName(fullName);
  
  let sum = 0;
  for (const char of normalized) {
    if (!VOWELS.has(char) && LETTER_VALUES[char]) {
      sum += LETTER_VALUES[char];
    }
  }
  
  return reduceNumber(sum, true);
}

/**
 * Calculate Challenge Number from birth date
 * No master number preservation
 */
export function calculateChallengeNumber(birthDate: string): number {
  let day: number, month: number, year: number;
  
  if (birthDate.includes('-')) {
    const [y, m, d] = birthDate.split('-').map(Number);
    year = y; month = m; day = d;
  } else if (birthDate.includes('/')) {
    const [d, m, y] = birthDate.split('/').map(Number);
    year = y; month = m; day = d;
  } else {
    throw new Error('Invalid date format');
  }
  
  const reducedDay = reduceNumber(day, false);
  const reducedMonth = reduceNumber(month, false);
  const reducedYear = reduceNumber(year, false);
  
  // D1 = |reduced day − reduced year|
  const d1 = Math.abs(reducedDay - reducedYear);
  // D2 = |reduced month − reduced year|
  const d2 = Math.abs(reducedMonth - reducedYear);
  // Challenge = |D1 − D2|
  const challenge = Math.abs(d1 - d2);
  
  // No master preservation for challenge
  return reduceNumber(challenge, false);
}

/**
 * Get Element from Life Path
 */
export function getElement(lifePath: number): string {
  const elementMap: Record<number, string> = {
    1: 'Air', 5: 'Air', 7: 'Air',     // Mental, exploratory
    2: 'Water', 6: 'Water',            // Relational, supportive
    3: 'Fire', 9: 'Fire',              // Expressive, catalytic
    4: 'Earth', 8: 'Earth',            // Structural, material
    11: 'Ether', 22: 'Ether', 33: 'Ether', // Transpersonal
  };
  
  return elementMap[lifePath] || 'Unknown';
}

/**
 * Get Archetype from Life Path
 */
export function getArchetype(lifePath: number): string {
  const archetypeMap: Record<number, string> = {
    1: 'Pioneer',
    2: 'Diplomat',
    3: 'Creator',
    4: 'Builder',
    5: 'Explorer',
    6: 'Nurturer',
    7: 'Sage',
    8: 'Executive',
    9: 'Humanitarian',
    11: 'Visionary Teacher',
    22: 'Master Builder',
    33: 'Master Healer',
  };
  
  return archetypeMap[lifePath] || 'Unknown';
}

export interface NumerologyProfile {
  // Core numbers
  lifePath: number;
  expressionNumber: number;
  soulUrge: number;
  personalityNumber: number;
  challengeNumber: number;
  
  // Derived
  element: string;
  archetype: string;
  
  // Raw input (for reference)
  birthName: string;
  birthDate: string;
}

/**
 * Calculate complete numerology profile
 */
export function calculateNumerologyProfile(birthName: string, birthDate: string): NumerologyProfile {
  const lifePath = calculateLifePath(birthDate);
  const expressionNumber = calculateExpressionNumber(birthName);
  const soulUrge = calculateSoulUrge(birthName);
  const personalityNumber = calculatePersonalityNumber(birthName);
  const challengeNumber = calculateChallengeNumber(birthDate);
  
  return {
    lifePath,
    expressionNumber,
    soulUrge,
    personalityNumber,
    challengeNumber,
    element: getElement(lifePath),
    archetype: getArchetype(lifePath),
    birthName: normalizeName(birthName),
    birthDate,
  };
}

/**
 * Get system intelligence signals based on numerology profile
 * These are used internally for routing and pacing, not shown to user
 */
export function getSystemSignals(profile: NumerologyProfile): {
  executionRhythm: 'fast' | 'steady' | 'reflective';
  avoidancePattern: string;
  idealFirstWinStyle: string;
  pressureTolerance: 'high' | 'medium' | 'low';
  structurePreference: 'high-structure' | 'balanced' | 'high-freedom';
  preferredMentorFirst: 'strategist' | 'creative' | 'alignment';
} {
  const { lifePath, challengeNumber, element, soulUrge } = profile;
  
  // Execution rhythm based on element
  let executionRhythm: 'fast' | 'steady' | 'reflective';
  if (element === 'Fire' || lifePath === 1 || lifePath === 5) {
    executionRhythm = 'fast';
  } else if (element === 'Earth' || lifePath === 4 || lifePath === 8) {
    executionRhythm = 'steady';
  } else {
    executionRhythm = 'reflective';
  }
  
  // Avoidance pattern based on challenge number
  const avoidancePatterns: Record<number, string> = {
    0: 'Avoiding any form of difficulty or challenge',
    1: 'Fear of standing out or taking independent action',
    2: 'Avoiding conflict, suppressing needs for others',
    3: 'Hiding authentic expression, fear of judgment',
    4: 'Resisting structure, avoiding sustained effort',
    5: 'Fear of commitment, escaping into distraction',
    6: 'Overgiving while neglecting self, perfectionism',
    7: 'Overthinking, avoiding action through analysis',
    8: 'Fear of power or success, self-sabotage',
    9: 'Holding onto things too long, fear of completion',
  };
  const avoidancePattern = avoidancePatterns[challengeNumber] || 'General resistance to action';
  
  // Ideal first win style based on life path
  let idealFirstWinStyle: string;
  if ([1, 5, 8].includes(lifePath)) {
    idealFirstWinStyle = 'Quick, visible result within 48 hours';
  } else if ([3, 9, 11].includes(lifePath)) {
    idealFirstWinStyle = 'Creative output or meaningful expression';
  } else if ([4, 22].includes(lifePath)) {
    idealFirstWinStyle = 'Concrete, measurable progress on a tangible goal';
  } else if ([2, 6, 33].includes(lifePath)) {
    idealFirstWinStyle = 'Connection or contribution that helps others';
  } else {
    idealFirstWinStyle = 'Insight or clarity that shifts perspective';
  }
  
  // Pressure tolerance
  let pressureTolerance: 'high' | 'medium' | 'low';
  if ([1, 4, 8, 22].includes(lifePath)) {
    pressureTolerance = 'high';
  } else if ([5, 9, 11].includes(lifePath)) {
    pressureTolerance = 'medium';
  } else {
    pressureTolerance = 'low';
  }
  
  // Structure preference
  let structurePreference: 'high-structure' | 'balanced' | 'high-freedom';
  if ([4, 8, 22].includes(lifePath)) {
    structurePreference = 'high-structure';
  } else if ([5, 3, 9].includes(lifePath)) {
    structurePreference = 'high-freedom';
  } else {
    structurePreference = 'balanced';
  }
  
  // Preferred mentor routing
  let preferredMentorFirst: 'strategist' | 'creative' | 'alignment';
  if ([1, 4, 8, 22].includes(lifePath)) {
    preferredMentorFirst = 'strategist';
  } else if ([3, 5, 9, 11, 33].includes(lifePath)) {
    preferredMentorFirst = 'creative';
  } else {
    preferredMentorFirst = 'alignment';
  }
  
  return {
    executionRhythm,
    avoidancePattern,
    idealFirstWinStyle,
    pressureTolerance,
    structurePreference,
    preferredMentorFirst,
  };
}
