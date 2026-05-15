/**
 * Boys Club roster. Each boy has:
 *  - id: stable key
 *  - name: display name
 *  - color: accent for glow + speech bubble
 *  - dance: which dance animation pattern (A/B/C/D/E)
 *  - phase: animation offset so they don't sync
 *  - mood-pool: speech topics that fit their character
 *
 * Image source for cutouts is /public/boys/<id>.png (added once we have the assets).
 */
export interface BoyDef {
  id: string;
  name: string;
  color: string;
  accent: string;
  dance: 'A' | 'B' | 'C' | 'D' | 'E';
  /** delay in beats (negative = start earlier) */
  delayBeats: number;
  scale: number;
}

// Order = visual left → right on stage. Eggplant in the center (he's the $DISCO hero).
export const BOYS: BoyDef[] = [
  {
    id: 'pepe',
    name: 'PEPE',
    color: '#39ff14',
    accent: '#1c6b1c',
    dance: 'A',
    delayBeats: 0,
    scale: 1.0,
  },
  {
    id: 'hippie',
    name: 'HIPPIE',
    color: '#b346c8',
    accent: '#3d0a4f',
    dance: 'E',
    delayBeats: 0.75,
    scale: 1.05,
  },
  {
    id: 'eggplant',
    name: 'EGGPLANT',
    color: '#ff2bd6',
    accent: '#5a1873',
    dance: 'C',
    delayBeats: -0.5,
    scale: 1.1,
  },
  {
    id: 'maus',
    name: 'BIZ MAUS',
    color: '#7aa3ff',
    accent: '#1f3a73',
    dance: 'B',
    delayBeats: 0.25,
    scale: 1.0,
  },
  {
    id: 'burns',
    name: 'BURNS',
    color: '#ffd24a',
    accent: '#7a4a00',
    dance: 'D',
    delayBeats: 1,
    scale: 0.95,
  },
];

// Path to a boy's PNG asset. Returns null if we don't have it yet.
export function boyImage(_id: string): string | null {
  // Vite turns /public/* into root URLs. We'll plug in actual files later.
  // Returning null = use placeholder SVG.
  return null;
}
