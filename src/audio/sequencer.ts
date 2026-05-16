import type { AudioEngine } from './engine';
import type { Patterns, StepCallback } from './types';
import type { PatternBank, PatternId, Song } from './song';
import { emptyPatterns } from './song';

const STEPS = 16;

/** Callback the UI subscribes to so it can render the playhead. */
export type SongCallback = (info: { slotIndex: number; barInSlot: number; step: number; patternId: PatternId; time: number }) => void;

export type PlaybackMode = 'song' | 'pattern';

export class Sequencer {
  bpm = 120;
  isPlaying = false;
  currentStep = 0;
  /** Bar number within the current song slot */
  barInSlot = 0;
  /** Which song slot is currently playing */
  songIndex = 0;

  /** Live pattern data — fed by the song + bank */
  patterns: Patterns = emptyPatterns();
  /** The pattern bank — A..H */
  bank: PatternBank = {} as PatternBank;
  /** The song = ordered list of slots */
  song: Song = [];
  /** Which pattern ID is currently sounding */
  currentPatternId: PatternId = 'A';

  /** How playback advances:
   *    'song'    — cycle through `song` slots at each bar boundary (default)
   *    'pattern' — loop the editing pattern only, don't advance song
   *  Set externally from state.ts when the UI toggle changes. */
  mode: PlaybackMode = 'song';
  /** Which pattern to loop while mode === 'pattern' */
  editingPatternId: PatternId = 'A';

  onStep: StepCallback | null = null;
  onSong: SongCallback | null = null;

  private audio: AudioEngine;
  private nextNoteTime = 0;
  private readonly lookahead = 25; // ms
  private readonly scheduleAheadTime = 0.12; // s
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor(audio: AudioEngine) {
    this.audio = audio;
  }

  setBPM(v: number): void {
    this.bpm = v;
    document.documentElement.style.setProperty('--beat-ms', `${60000 / v / 2}ms`);
  }

  start(): void {
    if (this.isPlaying || !this.audio.ctx) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.barInSlot = 0;
    if (this.mode === 'pattern') {
      // Loop the editing pattern; don't touch the song cursor
      this.loadEditingPattern();
    } else {
      this.songIndex = 0;
      this.loadSlot(0);
    }
    this.nextNoteTime = this.audio.ctx.currentTime + 0.05;
    this.tick();
  }

  stop(): void {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  toggle(): void {
    if (this.isPlaying) this.stop();
    else this.start();
  }

  /** Jump to a specific song slot (for click-to-play or transport scrub) */
  jumpToSlot(index: number): void {
    if (index < 0 || index >= this.song.length) return;
    this.songIndex = index;
    this.barInSlot = 0;
    this.currentStep = 0;
    this.loadSlot(index);
  }

  /** Pull a pattern from the bank into the live `patterns` slot. */
  loadSlot(index: number): void {
    const slot = this.song[index];
    if (!slot) return;
    const entry = this.bank[slot.patternId];
    if (!entry) return;
    this.patterns = entry.patterns; // live reference — edits show immediately
    this.currentPatternId = slot.patternId;
  }

  /** Pattern-loop mode: ignore song, play the editing pattern */
  loadEditingPattern(): void {
    const entry = this.bank[this.editingPatternId];
    if (!entry) return;
    this.patterns = entry.patterns;
    this.currentPatternId = this.editingPatternId;
  }

  /** Replace the editable patterns for a given pattern ID */
  writePattern(id: PatternId, patterns: Patterns): void {
    if (this.bank[id]) this.bank[id].patterns = patterns;
    if (id === this.currentPatternId) this.patterns = patterns;
  }

  clearCurrent(): void {
    const empty = emptyPatterns();
    this.writePattern(this.currentPatternId, empty);
  }

  private tick(): void {
    if (!this.isPlaying || !this.audio.ctx) return;
    while (this.nextNoteTime < this.audio.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      const stepDur = this.stepDur();
      this.nextNoteTime += stepDur;
      this.currentStep = (this.currentStep + 1) % STEPS;
      // Bar boundary
      if (this.currentStep === 0) {
        this.barInSlot += 1;
        if (this.mode === 'pattern') {
          // Pattern loop — never advance song. Just re-load the editing
          // pattern in case the user switched bank slot while playing.
          this.loadEditingPattern();
        } else {
          // Song mode — advance through the timeline
          const slot = this.song[this.songIndex];
          if (slot && this.barInSlot >= slot.bars) {
            this.barInSlot = 0;
            this.songIndex = (this.songIndex + 1) % this.song.length;
            this.loadSlot(this.songIndex);
          }
        }
      }
    }
    this.timerId = setTimeout(() => this.tick(), this.lookahead);
  }

  private scheduleStep(step: number, time: number): void {
    const p = this.patterns;
    if (p.kick[step]) this.audio.kick(time);
    if (p.snare[step]) this.audio.snare(time);
    if (p.clap[step]) this.audio.clap(time);
    if (p.hatC[step]) this.audio.hihat(time, false);
    if (p.hatO[step]) this.audio.hihat(time, true);
    if (p.cowbell[step]) this.audio.cowbell(time);
    if (p.bass[step]) this.audio.bass(time, this.audio.freqOf(p.bass[step]!), this.stepDur() * 0.95);
    if (p.lead[step]) this.audio.lead(time, this.audio.freqOf(p.lead[step]!), this.stepDur() * 1.5);
    if (this.onStep) this.onStep(step, time);
    if (this.onSong) {
      this.onSong({
        slotIndex: this.songIndex,
        barInSlot: this.barInSlot,
        step,
        patternId: this.currentPatternId,
        time,
      });
    }
  }

  private stepDur(): number {
    return 60 / this.bpm / 4;
  }
}
