/**
 * 16-step grid sequencer — 8 tracks (drums + bass + lead).
 *
 * Click a cell to toggle (or cycle bass/lead notes); right-click to clear.
 * The currently playing step is highlighted via the `currentStep()` signal.
 */
import { For } from 'solid-js';
import { currentStep, patternsVersion, seq, toggleCell, clearCell } from '../state';
import type { TrackKey } from '../audio/types';

interface TrackDef {
  key: TrackKey;
  label: string;
  note?: boolean;
}

const TRACKS: TrackDef[] = [
  { key: 'kick',    label: 'KICK 💥' },
  { key: 'snare',   label: 'SNR 🥁' },
  { key: 'clap',    label: 'CLP 👏' },
  { key: 'hatC',    label: 'HHC 🎩' },
  { key: 'hatO',    label: 'HHO 🎩' },
  { key: 'cowbell', label: 'COW 🔔' },
  { key: 'bass',    label: 'BAS 🎸', note: true },
  { key: 'lead',    label: 'LED 🎹', note: true },
];

export function Sequencer() {
  return (
    <div class="sequencer">
      <For each={TRACKS}>{(track) => <Track track={track} />}</For>
    </div>
  );
}

function Track(props: { track: TrackDef }) {
  // Touch patternsVersion so this re-renders when patterns mutate
  const cellState = (i: number) => {
    patternsVersion();
    return seq.patterns[props.track.key][i];
  };

  return (
    <div class="seq-row" data-track={props.track.key}>
      <div class="seq-label">{props.track.label}</div>
      <For each={Array.from({ length: 16 })}>
        {(_, i) => (
          <div
            class="seq-cell"
            classList={{
              'beat-mark': i() % 4 === 0,
              'note-cell': !!props.track.note,
              on: !!cellState(i()),
              playing: currentStep() === i(),
            }}
            onClick={() => toggleCell(props.track.key, i())}
            onContextMenu={(e) => {
              e.preventDefault();
              clearCell(props.track.key, i());
            }}
          >
            {props.track.note && cellState(i()) && (
              <span class="note-label">{cellState(i()) as string}</span>
            )}
          </div>
        )}
      </For>
    </div>
  );
}
