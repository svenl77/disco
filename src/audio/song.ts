/**
 * Song model — the timeline of patterns that compose a track.
 *
 * Inspired by classic drum machines (Roland TR-style Chain mode) + Ableton
 * Session view: you have a Pattern Bank of named patterns (A–H), and a Song
 * is just an ordered sequence of slots, each pointing at a pattern and saying
 * how many bars to play it.
 *
 *   PatternBank:  { A: {...}, B: {...}, C: {...} ... }
 *   Song:         [ {patternId:'A', bars:4}, {patternId:'B', bars:4}, ... ]
 *
 * The sequencer ticks 16 steps per bar, advances slot at each bar boundary,
 * loops back to slot 0 at the end of the song.
 */
import type { Patterns } from './types';

export type PatternId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
export const PATTERN_IDS: PatternId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/** Colours so each pattern in the song timeline is visually distinct */
export const PATTERN_COLORS: Record<PatternId, string> = {
  A: '#ff2bd6', // pink
  B: '#00f0ff', // cyan
  C: '#fff200', // yellow
  D: '#39ff14', // green
  E: '#ff7a00', // orange
  F: '#b346c8', // eggplant
  G: '#ffd24a', // gold
  H: '#7aa3ff', // pastel blue
};

export interface PatternBankEntry {
  id: PatternId;
  name: string;
  patterns: Patterns;
}

export type PatternBank = Record<PatternId, PatternBankEntry>;

export interface SongSlot {
  patternId: PatternId;
  bars: number;
}

export type Song = SongSlot[];

export function emptyPatterns(): Patterns {
  return {
    kick:    Array(16).fill(false),
    snare:   Array(16).fill(false),
    clap:    Array(16).fill(false),
    hatC:    Array(16).fill(false),
    hatO:    Array(16).fill(false),
    cowbell: Array(16).fill(false),
    bass:    Array(16).fill(null),
    lead:    Array(16).fill(null),
  };
}

export function clonePatterns(p: Patterns): Patterns {
  return {
    kick:    p.kick.slice(),
    snare:   p.snare.slice(),
    clap:    p.clap.slice(),
    hatC:    p.hatC.slice(),
    hatO:    p.hatO.slice(),
    cowbell: p.cowbell.slice(),
    bass:    p.bass.slice(),
    lead:    p.lead.slice(),
  };
}

/** Default-named patterns for the bank */
export const DEFAULT_PATTERN_NAMES: Record<PatternId, string> = {
  A: 'INTRO',
  B: 'VERSE',
  C: 'CHORUS',
  D: 'DROP',
  E: 'BREAK',
  F: 'BRIDGE',
  G: 'OUTRO',
  H: 'BONUS',
};
