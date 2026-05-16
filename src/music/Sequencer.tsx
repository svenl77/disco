/**
 * 16-step grid sequencer — 8 tracks (drums + bass + lead).
 *
 * Edits the CURRENTLY-EDITING pattern (from the bank), independent of which
 * pattern is playing. The playhead highlight still shows the live step
 * position so you see what's happening even while editing another pattern.
 */
import { For } from 'solid-js';
import { currentStep, patternsVersion, seq, editingPatternId, toggleCell, clearCell, playingPatternId } from '../state';
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
  { key: 'chord',   label: 'CHD 🎶', note: true },
];

export function Sequencer() {
  return (
    <div class="sequencer">
      <For each={TRACKS}>{(track) => <Track track={track} />}</For>
    </div>
  );
}

function Track(props: { track: TrackDef }) {
  // Read from the editing pattern (the bank slot the user selected)
  const cellState = (i: number) => {
    patternsVersion();
    const id = editingPatternId();
    return seq.bank[id]?.patterns[props.track.key][i];
  };
  // Show playhead highlight only if we're editing the pattern that's currently sounding
  const playheadActive = () => editingPatternId() === playingPatternId();

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
              playing: playheadActive() && currentStep() === i(),
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
