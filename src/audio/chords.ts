/**
 * Shared chord definitions used by both the sequencer's chord track and
 * any live-preview surface.
 *
 * 8 chords picked for a classic dancefloor disco vibe in C minor / Eb major
 * — extensions (m7, maj7, m9, 6, 7) keep things lush without getting jazz-
 * lounge boring.
 */
export interface ChordDef {
  /** Display name shown in cells / tooltips */
  name: string;
  /** Notes that make up the chord (used by AudioEngine.chord()) */
  notes: string[];
}

export const CHORDS: ChordDef[] = [
  { name: 'Cm9',    notes: ['C3',  'D#3', 'G3',  'A#3', 'D4'] },
  { name: 'Fm7',    notes: ['F3',  'G#3', 'C4',  'D#4', 'F4'] },
  { name: 'A#maj7', notes: ['A#2', 'D3',  'F3',  'A3',  'C4'] },
  { name: 'Gm7',    notes: ['G3',  'A#3', 'D4',  'F4',  'G4'] },
  { name: 'Eb6',    notes: ['D#3', 'G3',  'A#3', 'C4',  'D#4'] },
  { name: 'Dm9',    notes: ['D3',  'F3',  'A3',  'C4',  'E4'] },
  { name: 'Abmaj9', notes: ['G#2', 'C3',  'D#3', 'G3',  'A#3'] },
  { name: 'Bb7',    notes: ['A#2', 'D3',  'F3',  'G#3', 'C4'] },
];

export const CHORD_NAMES = CHORDS.map((c) => c.name);

export function chordByName(name: string): ChordDef | undefined {
  return CHORDS.find((c) => c.name === name);
}
