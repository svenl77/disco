export type DrumTrack = 'kick' | 'snare' | 'clap' | 'hatC' | 'hatO' | 'cowbell';
export type NoteTrack = 'bass' | 'lead';
export type TrackKey = DrumTrack | NoteTrack;

export type DrumPattern = boolean[];
export type NotePattern = (string | null)[];

export interface Patterns {
  kick: DrumPattern;
  snare: DrumPattern;
  clap: DrumPattern;
  hatC: DrumPattern;
  hatO: DrumPattern;
  cowbell: DrumPattern;
  bass: NotePattern;
  lead: NotePattern;
}

export interface Preset extends Patterns {}

export type StepCallback = (step: number, time: number) => void;
