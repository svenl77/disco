/**
 * Global app state — Solid signals + a small action API.
 *
 * Two reactive layers:
 *  - musicState: BPM, playing, currentStep, intensity (drives the boys' speed)
 *  - sceneState: mood, drop-events, bubble queue (consumed by the stage)
 */
import { createSignal, createMemo } from 'solid-js';
import { AudioEngine } from './audio/engine';
import { Sequencer } from './audio/sequencer';
import { PRESETS } from './audio/presets';
import type { Patterns } from './audio/types';

export const audio = new AudioEngine();
export const seq = new Sequencer(audio);

// === Music state ===
export const [bpm, setBpm] = createSignal(120);
export const [volume, setVolume] = createSignal(0.75);
export const [filter, setFilter] = createSignal(8000);
export const [reverb, setReverb] = createSignal(0.22);
export const [isPlaying, setIsPlaying] = createSignal(false);
export const [currentStep, setCurrentStep] = createSignal(-1);
export const [activePreset, setActivePreset] = createSignal<string | null>('DISCO INFERNO');
export const [acidMode, setAcidMode] = createSignal(false);
// counter increments on every full bar — components reactive to "the beat"
export const [barCount, setBarCount] = createSignal(0);
// monotonically increases each time .randomize/.load/.clear runs — UI re-renders
export const [patternsVersion, setPatternsVersion] = createSignal(0);

// === Scene state ===
export type Mood = 'idle' | 'groove' | 'hype' | 'drop' | 'acid';
export const [mood, setMood] = createSignal<Mood>('groove');
export const [lastDrop, setLastDrop] = createSignal(0); // timestamp of last drop

// Derived: intensity 0..1 from kick density × playing
export const intensity = createMemo<number>(() => {
  if (!isPlaying()) return 0;
  // referencing patternsVersion so this memo invalidates when patterns mutate
  patternsVersion();
  const kicks = seq.patterns.kick.filter(Boolean).length;
  return Math.min(1, kicks / 16 + 0.2);
});

// === Boot ===
seq.load(PRESETS['DISCO INFERNO']);

seq.onStep = (step) => {
  setCurrentStep(step);
  if (step === 0) setBarCount((n) => n + 1);
};

// === Actions ===
export async function togglePlay(): Promise<void> {
  await audio.init();
  audio.setMaster(volume() * volume());
  audio.setFilter(filter());
  audio.setReverb(reverb() * 0.7);
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

export function loadPreset(name: string): void {
  const preset = PRESETS[name];
  if (!preset) return;
  seq.load(preset);
  setActivePreset(name);
  setPatternsVersion((v) => v + 1);
  if (name === 'ACID DISCO') {
    audio.acidMode = true;
    setAcidMode(true);
    setMood('acid');
  } else {
    audio.acidMode = false;
    setAcidMode(false);
    setMood('groove');
  }
}

export function randomizePattern(): void {
  seq.randomize();
  setActivePreset(null);
  setPatternsVersion((v) => v + 1);
}

export function clearPattern(): void {
  seq.clear();
  setActivePreset(null);
  setPatternsVersion((v) => v + 1);
}

export function toggleCell(track: keyof Patterns, step: number): void {
  const pats = seq.patterns;
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
  const pats = seq.patterns;
  if (track === 'bass' || track === 'lead') {
    pats[track][step] = null;
  } else {
    pats[track][step] = false;
  }
  setPatternsVersion((v) => v + 1);
}

// Initial BPM application
seq.setBPM(120);
