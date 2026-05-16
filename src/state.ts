/**
 * Global app state — Solid signals + a small action API.
 *
 * Music model:
 *  - patternBank: a stash of named patterns A..H (each = full 8-track grid)
 *  - song: ordered list of slots, each = which pattern to play & for how many bars
 *  - editingPatternId: which pattern the user is currently editing in the
 *    sequencer view (independent of what's playing)
 *  - sequencer plays through `song`, hot-loading the appropriate pattern at
 *    each bar boundary
 */
import { createSignal, createMemo, createEffect } from 'solid-js';
import { AudioEngine } from './audio/engine';
import { Sequencer, type PlaybackMode } from './audio/sequencer';
import { PRESETS } from './audio/presets';
import type { Patterns } from './audio/types';
import {
  PATTERN_IDS,
  DEFAULT_PATTERN_NAMES,
  clonePatterns,
  type PatternBank,
  type PatternId,
  type Song,
} from './audio/song';

export const audio = new AudioEngine();
export const seq = new Sequencer(audio);

// === Music state ===
export const [bpm, setBpm] = createSignal(120);
export const [volume, setVolume] = createSignal(0.75);
export const [filter, setFilter] = createSignal(8000);
export const [reverb, setReverb] = createSignal(0.22);
export const [isPlaying, setIsPlaying] = createSignal(false);
export const [currentStep, setCurrentStep] = createSignal(-1);
export const [acidMode, setAcidMode] = createSignal(false);
// counter increments on every full bar
export const [barCount, setBarCount] = createSignal(0);
// monotonically increases when patterns mutate — UI re-renders
export const [patternsVersion, setPatternsVersion] = createSignal(0);

/** Pattern Bank state — A..H named patterns, each holds its own 8-track grid. */
export const [patternBank, setPatternBank] = createSignal<PatternBank>(buildInitialBank());

/** The song is a list of slots: { patternId, bars }. */
export const [song, setSong] = createSignal<Song>([
  { patternId: 'A', bars: 4 },
  { patternId: 'B', bars: 4 },
  { patternId: 'C', bars: 4 },
  { patternId: 'D', bars: 4 },
]);

/** Which pattern slot is currently sounding (read from sequencer in real-time) */
export const [playingPatternId, setPlayingPatternId] = createSignal<PatternId>('A');
/** Which song slot is currently sounding (0-based index into `song`) */
export const [playingSlotIndex, setPlayingSlotIndex] = createSignal<number>(0);

/** Which pattern the user is editing (independent of playback) */
export const [editingPatternId, setEditingPatternId] = createSignal<PatternId>('A');

/** Which music-panel tab is open ('easy' shows the timeline + drop/shuffle,
 *  'studio' adds the pattern bank + 16-step editor + chord pads). Lifted to
 *  global state so actions like createNewRecord() can switch to Studio. */
export const [musicTab, setMusicTab] = createSignal<'easy' | 'studio'>('easy');

/** Playback mode:
 *    'song'    = cycle the timeline (default)
 *    'pattern' = loop ONLY the editing pattern (composing mode)
 *  The user toggles this with the switch on the timeline header. */
export const [playbackMode, setPlaybackMode] = createSignal<PlaybackMode>('song');

// === Scene state ===
export type Mood = 'idle' | 'groove' | 'hype' | 'drop' | 'acid';
export const [mood, setMood] = createSignal<Mood>('groove');
export const [lastDrop, setLastDrop] = createSignal(0);

// Derived: intensity 0..1 from current pattern's kick density × playing
export const intensity = createMemo<number>(() => {
  if (!isPlaying()) return 0;
  patternsVersion();
  const kicks = seq.patterns.kick.filter(Boolean).length;
  return Math.min(1, kicks / 16 + 0.2);
});

function buildInitialBank(): PatternBank {
  // Seed the bank with our 6 presets — A=DISCO INFERNO, B=STAYIN ALIVE, etc.
  // remaining slots get empty patterns.
  const presetNames = Object.keys(PRESETS);
  const bank = {} as PatternBank;
  PATTERN_IDS.forEach((id, i) => {
    const presetName = presetNames[i];
    bank[id] = {
      id,
      name: presetName ?? DEFAULT_PATTERN_NAMES[id],
      patterns: presetName
        ? clonePatterns(PRESETS[presetName])
        : {
            kick:    Array(16).fill(false),
            snare:   Array(16).fill(false),
            clap:    Array(16).fill(false),
            hatC:    Array(16).fill(false),
            hatO:    Array(16).fill(false),
            cowbell: Array(16).fill(false),
            bass:    Array(16).fill(null),
            lead:    Array(16).fill(null),
          },
    };
  });
  return bank;
}

// === Boot ===
seq.bank = patternBank();
seq.song = song();
seq.loadSlot(0);

seq.onStep = (step) => {
  setCurrentStep(step);
  if (step === 0) setBarCount((n) => n + 1);
};
seq.onSong = (info) => {
  setPlayingPatternId(info.patternId);
  setPlayingSlotIndex(info.slotIndex);
};

// Sync playbackMode + editingPatternId to the sequencer so it knows what
// to play when mode === 'pattern' and what to switch to live.
createEffect(() => {
  seq.mode = playbackMode();
  seq.editingPatternId = editingPatternId();
  // If we're playing and switched to pattern mode (or the editing pattern
  // changed in pattern mode), hot-swap the live pattern so it loops correctly.
  if (seq.isPlaying && seq.mode === 'pattern') {
    seq.loadEditingPattern();
  }
});

// === Actions ===
export async function togglePlay(): Promise<void> {
  await audio.init();
  audio.setMaster(volume() * volume());
  audio.setFilter(filter());
  audio.setReverb(reverb() * 0.7);
  seq.bank = patternBank();
  seq.song = song();
  seq.toggle();
  setIsPlaying(seq.isPlaying);
}

export async function triggerDrop(): Promise<void> {
  await audio.init();
  audio.drop();
  setLastDrop(performance.now());
  setMood('drop');
  setTimeout(() => setMood(acidMode() ? 'acid' : 'hype'), 1700);
  setTimeout(() => setMood('groove'), 4000);
}

/* === Per-boy click actions === */
export type BoyAction = {
  boyId: string;
  ts: number;
  mood: 'drop' | 'hype' | 'idle' | 'acid' | 'start';
  bubbles: number;
  flash: string;
};
export const [lastBoyAction, setLastBoyAction] = createSignal<BoyAction | null>(null);

/** Disco-ball click → fireworks. ts = performance.now() to ensure each click
 *  creates a fresh signal value the effect can react to. */
export const [lastBallClick, setLastBallClick] = createSignal(0);

export async function triggerDiscoBall(): Promise<void> {
  await audio.init();
  // Small celebratory pop: crash + brief filter sweep
  const t = audio.ctx!.currentTime;
  audio.crash(t, 0.7);
  audio.crash(t + 0.18, 0.5);
  audio.crash(t + 0.42, 0.6);
  setLastBallClick(performance.now());
}

export async function triggerBoyAction(boyId: string): Promise<void> {
  await audio.init();
  audio.setMaster(volume() * volume());
  audio.setFilter(filter());
  audio.setReverb(reverb() * 0.7);

  let action: BoyAction;
  switch (boyId) {
    case 'eggplant':
      audio.drop();
      setLastDrop(performance.now());
      setMood('drop');
      setTimeout(() => setMood(acidMode() ? 'acid' : 'hype'), 1700);
      setTimeout(() => setMood('groove'), 4000);
      action = { boyId, ts: performance.now(), mood: 'drop', bubbles: 3, flash: '#ff2bd6' };
      break;

    case 'pepe':
      audio.pepeKek();
      action = { boyId, ts: performance.now(), mood: 'hype', bubbles: 4, flash: '#39ff14' };
      break;

    case 'maus':
      audio.mausPiano();
      action = { boyId, ts: performance.now(), mood: 'idle', bubbles: 2, flash: '#7aa3ff' };
      break;

    case 'andy':
      audio.burnsClink();  // glass-clink — perfect for a bartender
      action = { boyId, ts: performance.now(), mood: 'hype', bubbles: 2, flash: '#ffd24a' };
      break;

    case 'landwulf':
      audio.landwulfHowl();
      action = { boyId, ts: performance.now(), mood: 'acid', bubbles: 3, flash: '#ff7a00' };
      break;

    default:
      return;
  }
  setLastBoyAction(action);
}

export function setBpmValue(v: number): void {
  setBpm(v);
  seq.setBPM(v);
}
export function setVolumeValue(v: number): void {
  setVolume(v);
  if (audio.ctx) audio.setMaster(v * v);
}
export function setFilterValue(v: number): void {
  setFilter(v);
  if (audio.ctx) audio.setFilter(v);
}
export function setReverbValue(v: number): void {
  setReverb(v);
  if (audio.ctx) audio.setReverb(v * 0.7);
}

/* === Pattern editing — operations on the bank === */
export function toggleCell(track: keyof Patterns, step: number): void {
  const id = editingPatternId();
  const pats = seq.bank[id].patterns;
  if (track === 'bass' || track === 'lead') {
    const notes = track === 'bass'
      ? ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'C3', 'D3']
      : ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'];
    const cur = pats[track][step];
    if (!cur) pats[track][step] = notes[0];
    else {
      const i = notes.indexOf(cur);
      pats[track][step] = i === notes.length - 1 ? null : notes[i + 1];
    }
  } else {
    pats[track][step] = !pats[track][step];
  }
  setPatternsVersion((v) => v + 1);
}

export function clearCell(track: keyof Patterns, step: number): void {
  const id = editingPatternId();
  const pats = seq.bank[id].patterns;
  if (track === 'bass' || track === 'lead') {
    pats[track][step] = null;
  } else {
    pats[track][step] = false;
  }
  setPatternsVersion((v) => v + 1);
}

/** Load a preset into the currently-editing pattern slot */
export function loadPresetIntoEditing(name: string): void {
  const preset = PRESETS[name];
  if (!preset) return;
  const id = editingPatternId();
  seq.bank[id] = { ...seq.bank[id], name, patterns: clonePatterns(preset) };
  setPatternBank({ ...seq.bank });
  setPatternsVersion((v) => v + 1);
  if (name === 'ACID DISCO') {
    audio.acidMode = true;
    setAcidMode(true);
  } else {
    audio.acidMode = false;
    setAcidMode(false);
  }
}

export function randomizeEditing(): void {
  const id = editingPatternId();
  const p = seq.bank[id].patterns;
  p.kick = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0].map(Boolean);
  p.snare = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean);
  p.clap = [0, 0, 0, 0, Math.random() > 0.5 ? 1 : 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0].map(Boolean);
  p.hatC = Array.from({ length: 16 }, (_, i) => Math.random() < (i % 2 ? 0.55 : 0.15));
  p.hatO = Array.from({ length: 16 }, () => Math.random() < 0.1);
  p.cowbell = Array.from({ length: 16 }, () => Math.random() < 0.12);
  const bassPool = ['C2', 'D#2', 'F2', 'G2', 'A#2', 'C3'];
  p.bass = Array.from({ length: 16 }, (_, i) =>
    i % 4 === 0 || Math.random() < 0.35 ? bassPool[Math.floor(Math.random() * bassPool.length)] : null,
  );
  const leadPool = ['C5', 'D#5', 'F5', 'G5', 'A#5'];
  p.lead = Array.from({ length: 16 }, () =>
    Math.random() < 0.18 ? leadPool[Math.floor(Math.random() * leadPool.length)] : null,
  );
  setPatternsVersion((v) => v + 1);
}

export function clearEditing(): void {
  const id = editingPatternId();
  const p = seq.bank[id].patterns;
  p.kick = Array(16).fill(false);
  p.snare = Array(16).fill(false);
  p.clap = Array(16).fill(false);
  p.hatC = Array(16).fill(false);
  p.hatO = Array(16).fill(false);
  p.cowbell = Array(16).fill(false);
  p.bass = Array(16).fill(null);
  p.lead = Array(16).fill(null);
  setPatternsVersion((v) => v + 1);
}

/* === Song editing === */
export function selectPattern(id: PatternId): void {
  setEditingPatternId(id);
}

export function addSongSlot(patternId: PatternId = 'A', bars = 4): void {
  setSong((s) => [...s, { patternId, bars }]);
  seq.song = song();
}

export function removeSongSlot(index: number): void {
  if (song().length <= 1) return;
  setSong((s) => s.filter((_, i) => i !== index));
  seq.song = song();
  if (seq.songIndex >= seq.song.length) seq.songIndex = 0;
}

export function setSlotPattern(index: number, patternId: PatternId): void {
  setSong((s) => s.map((slot, i) => (i === index ? { ...slot, patternId } : slot)));
  seq.song = song();
}

export function setSlotBars(index: number, bars: number): void {
  const safe = Math.max(1, Math.min(16, bars));
  setSong((s) => s.map((slot, i) => (i === index ? { ...slot, bars: safe } : slot)));
  seq.song = song();
}

export function jumpToSongSlot(index: number): void {
  seq.jumpToSlot(index);
  setPlayingSlotIndex(index);
}

export function renamePattern(id: PatternId, name: string): void {
  if (!seq.bank[id]) return;
  seq.bank[id] = { ...seq.bank[id], name };
  setPatternBank({ ...seq.bank });
}

/** Empty a single bank slot — leaves its name, wipes all steps + notes */
export function clearBankSlot(id: PatternId): void {
  const empty: Patterns = {
    kick:    Array(16).fill(false),
    snare:   Array(16).fill(false),
    clap:    Array(16).fill(false),
    hatC:    Array(16).fill(false),
    hatO:    Array(16).fill(false),
    cowbell: Array(16).fill(false),
    bass:    Array(16).fill(null),
    lead:    Array(16).fill(null),
  };
  if (!seq.bank[id]) return;
  seq.bank[id] = { ...seq.bank[id], patterns: empty };
  setPatternBank({ ...seq.bank });
  setPatternsVersion((v) => v + 1);
}

/** "+ NEW RECORD" — picks an empty bank slot (or empties an unused one),
 *  appends it to the song, switches to Studio mode, selects it for editing.
 *  Result: user sees a fresh 16-step grid ready to fill. */
export function createNewRecord(): void {
  const usedInSong = new Set(song().map((s) => s.patternId));

  function isEmptyBank(id: PatternId): boolean {
    const p = seq.bank[id]?.patterns;
    if (!p) return false;
    return (
      !p.kick.some(Boolean) &&
      !p.snare.some(Boolean) &&
      !p.clap.some(Boolean) &&
      !p.hatC.some(Boolean) &&
      !p.hatO.some(Boolean) &&
      !p.cowbell.some(Boolean) &&
      !p.bass.some((x) => x !== null) &&
      !p.lead.some((x) => x !== null)
    );
  }

  // Preference order: empty + unused → unused (will clear) → least-used in song
  let target = PATTERN_IDS.find((id) => isEmptyBank(id) && !usedInSong.has(id));
  if (!target) {
    target = PATTERN_IDS.find((id) => !usedInSong.has(id));
    if (target) clearBankSlot(target);
  }
  if (!target) {
    // All 8 slots are in the song; rotate from the editing one
    const curIdx = PATTERN_IDS.indexOf(editingPatternId());
    target = PATTERN_IDS[(curIdx + 1) % PATTERN_IDS.length];
    clearBankSlot(target);
  }

  addSongSlot(target, 4);
  setEditingPatternId(target);
  setMusicTab('studio');
  // Jump playback to the new slot so the user immediately hears it (silent)
  // and the sequencer's playhead is in the right place when they hit play
  const newSlotIndex = song().length - 1;
  jumpToSongSlot(newSlotIndex);
}

/** Start fresh — clear every bank pattern + reset song to a single A slot */
export function newSong(): void {
  const wasPlaying = seq.isPlaying;
  if (wasPlaying) seq.stop();
  // Clear all patterns, keep names from DEFAULT_PATTERN_NAMES
  PATTERN_IDS.forEach((id) => {
    seq.bank[id] = {
      id,
      name: DEFAULT_PATTERN_NAMES[id],
      patterns: {
        kick:    Array(16).fill(false),
        snare:   Array(16).fill(false),
        clap:    Array(16).fill(false),
        hatC:    Array(16).fill(false),
        hatO:    Array(16).fill(false),
        cowbell: Array(16).fill(false),
        bass:    Array(16).fill(null),
        lead:    Array(16).fill(null),
      },
    };
  });
  setPatternBank({ ...seq.bank });
  setSong([{ patternId: 'A', bars: 4 }]);
  seq.song = song();
  setEditingPatternId('A');
  seq.jumpToSlot(0);
  setPatternsVersion((v) => v + 1);
  setPlayingPatternId('A');
  setPlayingSlotIndex(0);
}

// Initial BPM application
seq.setBPM(120);
