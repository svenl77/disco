/**
 * Set serialization — pack the full song into a tiny URL-safe string.
 *
 * Format: base64url(JSON({ v, bpm, bank, song, mood })). v=2 introduces the
 * Pattern Bank + Song timeline; v=1 is migrated on load (whole set becomes
 * pattern A, song = single 4-bar slot of A).
 */
import type { Patterns } from '../audio/types';
import type { PatternBank, Song } from '../audio/song';

const VERSION = 2;

export interface DiscoSet {
  v: number;
  bpm: number;
  bank: PatternBank;
  song: Song;
  mood: string;
}

// Legacy v1 format — single pattern + preset name
interface DiscoSetV1 {
  v: 1;
  bpm: number;
  patterns: Patterns;
  preset: string | null;
  mood: string;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const norm = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(norm);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodeSet(set: Omit<DiscoSet, 'v'>): string {
  const payload: DiscoSet = { v: VERSION, ...set };
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
}

export function decodeSet(encoded: string): DiscoSet | null {
  try {
    const bytes = base64UrlDecode(encoded);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);
    if (parsed?.v === 2) return parsed as DiscoSet;
    if (parsed?.v === 1) return migrateV1(parsed as DiscoSetV1);
    return null;
  } catch {
    return null;
  }
}

function migrateV1(v1: DiscoSetV1): DiscoSet {
  // Whole pattern becomes slot A, song = one block of A × 4 bars
  const empty = {
    kick:    Array(16).fill(false),
    snare:   Array(16).fill(false),
    clap:    Array(16).fill(false),
    hatC:    Array(16).fill(false),
    hatO:    Array(16).fill(false),
    cowbell: Array(16).fill(false),
    bass:    Array(16).fill(null) as (string | null)[],
    lead:    Array(16).fill(null) as (string | null)[],
    chord:   Array(16).fill(null) as (string | null)[],
  };
  // Also tolerate v1 patterns that pre-date the chord track
  const v1Patterns: Patterns = {
    ...v1.patterns,
    chord: (v1.patterns as Patterns).chord ?? Array(16).fill(null),
  };
  return {
    v: 2,
    bpm: v1.bpm,
    bank: {
      A: { id: 'A', name: v1.preset ?? 'A', patterns: v1Patterns },
      B: { id: 'B', name: 'B', patterns: { ...empty } },
      C: { id: 'C', name: 'C', patterns: { ...empty } },
      D: { id: 'D', name: 'D', patterns: { ...empty } },
      E: { id: 'E', name: 'E', patterns: { ...empty } },
      F: { id: 'F', name: 'F', patterns: { ...empty } },
      G: { id: 'G', name: 'G', patterns: { ...empty } },
      H: { id: 'H', name: 'H', patterns: { ...empty } },
    },
    song: [{ patternId: 'A', bars: 4 }],
    mood: v1.mood,
  };
}

export function shareURL(set: Omit<DiscoSet, 'v'>): string {
  const encoded = encodeSet(set);
  const url = new URL(window.location.href);
  url.hash = `s=${encoded}`;
  return url.toString();
}

export function setFromCurrentURL(): DiscoSet | null {
  if (!window.location.hash) return null;
  const m = window.location.hash.match(/s=([^&]+)/);
  if (!m) return null;
  return decodeSet(m[1]);
}

export function downloadJSON(set: Omit<DiscoSet, 'v'>, filename = 'boys-club-set.json'): void {
  const payload: DiscoSet = { v: VERSION, ...set };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
