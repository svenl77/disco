/**
 * Music panel — two faces:
 *  - Reduced: 4 buttons + a single fun slider, low-friction for casual visitors
 *  - Extended: full sequencer + chord pads + knobs (this comes next)
 *
 * The reduced panel is the default. Toggling to extended progressively reveals
 * the producer toys without scaring off the first-time visitor.
 */
import { createSignal, Show, For } from 'solid-js';
import { PRESETS } from '../audio/presets';
import {
  bpm,
  isPlaying,
  togglePlay,
  triggerDrop,
  randomizePattern,
  loadPreset,
  setBpmValue,
  activePreset,
} from '../state';
import './music.css';

export function MusicPanel() {
  const [extended, setExtended] = createSignal(false);

  return (
    <section class="music-panel">
      <div class="music-tabs">
        <button
          class="music-tab"
          classList={{ active: !extended() }}
          onClick={() => setExtended(false)}
        >
          🍹 EASY
        </button>
        <button
          class="music-tab"
          classList={{ active: extended() }}
          onClick={() => setExtended(true)}
        >
          🎛 STUDIO
        </button>
      </div>

      <Show when={!extended()} fallback={<ExtendedPanel />}>
        <ReducedPanel />
      </Show>
    </section>
  );
}

function ReducedPanel() {
  return (
    <div class="reduced-panel">
      <div class="reduced-row">
        <button
          class="big-btn play"
          classList={{ playing: isPlaying() }}
          onClick={togglePlay}
        >
          {isPlaying() ? '⏸ STOP' : '▶ PLAY'}
        </button>
        <button class="big-btn drop" onClick={() => void triggerDrop()}>
          🚀 DROP
        </button>
        <button class="big-btn rand" onClick={randomizePattern}>
          🎲 SHUFFLE
        </button>
      </div>

      <div class="bpm-row">
        <label class="bpm-label">TEMPO</label>
        <input
          type="range"
          min="80"
          max="160"
          value={bpm()}
          onInput={(e) => setBpmValue(+e.currentTarget.value)}
        />
        <span class="bpm-val">{bpm()} BPM</span>
      </div>

      <div class="preset-strip">
        <For each={Object.keys(PRESETS)}>
          {(name) => (
            <button
              class="preset-pill"
              classList={{ active: activePreset() === name }}
              onClick={() => loadPreset(name)}
            >
              {name}
            </button>
          )}
        </For>
      </div>
    </div>
  );
}

function ExtendedPanel() {
  return (
    <div class="extended-panel">
      <div class="extended-placeholder">
        <strong>STUDIO MODE</strong>
        <p>
          Full sequencer · chord pads · per-track FX coming in the next iteration.
          For now the easy panel covers the action.
        </p>
      </div>
    </div>
  );
}
