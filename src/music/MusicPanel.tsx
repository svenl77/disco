/**
 * Music panel — Easy + Studio tabs.
 *
 *   Easy:   timeline + play + tempo + drop + shuffle — minimum to compose.
 *   Studio: timeline + pattern bank + 16-step editor + chord pads + knobs.
 */
import { Show, For } from 'solid-js';
import {
  bpm,
  isPlaying,
  togglePlay,
  triggerDrop,
  randomizeEditing,
  clearEditing,
  loadPresetIntoEditing,
  setBpmValue,
  setVolumeValue,
  setFilterValue,
  setReverbValue,
  volume,
  filter,
  reverb,
  editingPatternId,
  newSong,
  musicTab,
  setMusicTab,
} from '../state';
import { PRESETS } from '../audio/presets';
import { Sequencer } from './Sequencer';
import { TimelineView } from './TimelineView';
import { PatternBank } from './PatternBank';
import './music.css';

export function MusicPanel() {
  return (
    <section class="music-panel">
      <div class="music-tabs">
        <button class="music-tab" classList={{ active: musicTab() === 'easy' }} onClick={() => setMusicTab('easy')}>
          🍹 EASY
        </button>
        <button class="music-tab" classList={{ active: musicTab() === 'studio' }} onClick={() => setMusicTab('studio')}>
          🎛 STUDIO
        </button>
      </div>

      <Show when={musicTab() === 'easy'} fallback={<StudioPanel />}>
        <EasyPanel />
      </Show>
    </section>
  );
}

function EasyPanel() {
  return (
    <div class="easy-panel">
      <div class="easy-cta">
        <span class="easy-cta-title">CREATE YOUR DISCO HIT</span>
        <span class="easy-cta-sub">tap blocks to switch · ▶ to play · 🚀 to drop</span>
      </div>

      <TimelineView editable={false} />

      <div class="easy-controls">
        <button class="big-btn drop" onClick={() => void triggerDrop()}>🚀 DROP</button>
        <button class="big-btn rand" onClick={randomizeEditing}>🎲 SHUFFLE</button>
        <div class="easy-bpm">
          <label class="bpm-label">TEMPO</label>
          <input type="range" min="80" max="160" value={bpm()} onInput={(e) => setBpmValue(+e.currentTarget.value)} />
          <span class="bpm-val">{bpm()} BPM</span>
        </div>
      </div>
    </div>
  );
}

function StudioPanel() {
  return (
    <div class="extended-panel">
      <TimelineView editable={true} />

      <div class="studio-row">
        <button class="big-btn play" classList={{ playing: isPlaying() }} onClick={togglePlay}>
          {isPlaying() ? '⏸ STOP' : '▶ PLAY'}
        </button>
        <button class="big-btn drop" onClick={() => void triggerDrop()}>🚀 DROP</button>
        <button class="big-btn rand" onClick={randomizeEditing}>🎲 RANDOM</button>
        <button class="big-btn clear" onClick={clearEditing}>✕ CLEAR PATTERN</button>
        <button
          class="big-btn newsong"
          onClick={() => {
            if (confirm('Start a fresh song? This wipes ALL patterns + the timeline.')) {
              newSong();
            }
          }}
        >
          🗑 NEW SONG
        </button>
      </div>

      <div class="knobs">
        <Knob label="TEMPO" min={80} max={160} value={bpm()} onInput={setBpmValue} fmt={(v) => `${v} BPM`} />
        <Knob label="VOLUME" min={0} max={100} value={Math.round(volume() * 100)}
              onInput={(v) => setVolumeValue(v / 100)} fmt={(v) => `${v}%`} />
        <Knob label="FILTER" min={200} max={14000} step={50} value={filter()}
              onInput={setFilterValue} fmt={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}kHz` : `${v}Hz`} />
        <Knob label="REVERB" min={0} max={100} value={Math.round(reverb() * 100 / 0.7)}
              onInput={(v) => setReverbValue(v / 100 * 0.7)} fmt={(v) => `${v}%`} />
      </div>

      <div class="studio-presets">
        <span class="studio-preset-label">LOAD INTO {editingPatternId()}:</span>
        <For each={Object.keys(PRESETS)}>
          {(name) => (
            <button class="preset-pill" onClick={() => loadPresetIntoEditing(name)}>{name}</button>
          )}
        </For>
      </div>

      <div class="studio-section">
        <div class="studio-title">PATTERN BANK · click to edit, double-click to rename</div>
        <PatternBank />
        <div class="studio-title" style={{ 'margin-top': '14px' }}>
          EDITING {editingPatternId()} · DRUMS · BASS · LEAD · CHORDS
        </div>
        <Sequencer />
      </div>
    </div>
  );
}

function Knob(props: {
  label: string; min: number; max: number; step?: number;
  value: number; onInput: (v: number) => void; fmt: (v: number) => string;
}) {
  return (
    <div class="knob">
      <label>{props.label}</label>
      <input
        type="range" min={props.min} max={props.max} step={props.step ?? 1}
        value={props.value}
        onInput={(e) => props.onInput(+e.currentTarget.value)}
      />
      <div class="val">{props.fmt(props.value)}</div>
    </div>
  );
}
