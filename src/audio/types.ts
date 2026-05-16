export type DrumTrack = 'kick' | 'snare' | 'clap' | 'hatC' | 'hatO' | 'cowbell';
export type NoteTrack = 'bass' | 'lead';
export type ChordTrack = 'chord';
export type TrackKey = DrumTrack | NoteTrack | ChordTrack;

export type DrumPattern = boolean[];
export type NotePattern = (string | null)[];
/** Each chord cell holds a chord NAME (e.g. 'Cm9') or null. Notes are
 *  resolved at playback time via chordByName(). */
export type ChordPattern = (string | null)[];

export interface Patterns {
  kick: DrumPattern;
  snare: DrumPattern;
  clap: DrumPattern;
  hatC: DrumPattern;
  hatO: DrumPattern;
  cowbell: DrumPattern;
  bass: NotePattern;
  lead: NotePattern;
  chord: ChordPattern;
}

export interface Preset extends Patterns {}

export type StepCallback = (step: number, time: number) => void;
