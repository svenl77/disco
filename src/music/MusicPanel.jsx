/**
 * Music panel — two faces:
 *  - Reduced: 4 buttons + a single fun slider, low-friction for casual visitors
 *  - Extended: full sequencer + chord pads + knobs (this comes next)
 *
 * The reduced panel is the default. Toggling to extended progressively reveals
 * the producer toys without scaring off the first-time visitor.
 */
import { createSignal, For, Show } from 'solid-js';
import { PRESETS } from '../audio/presets';
import { bpm, isPlaying, togglePlay, triggerDrop, randomizePattern, clearPattern, loadPreset, setBpmValue, setVolumeValue, setFilterValue, setReverbValue, volume, filter, reverb, activePreset, } from '../state';
import { Sequencer } from './Sequencer';
import { ChordPads } from './ChordPads';
import './music.css';
export function MusicPanel() {
    const [extended, setExtended] = createSignal(false);
    return (<section class="music-panel">
      <div class="music-tabs">
        <button class="music-tab" classList={{ active: !extended() }} onClick={() => setExtended(false)}>
          🍹 EASY
        </button>
        <button class="music-tab" classList={{ active: extended() }} onClick={() => setExtended(true)}>
          🎛 STUDIO
        </button>
      </div>

      <Show when={!extended()} fallback={<ExtendedPanel />}>
        <ReducedPanel />
      </Show>
    </section>);
}
function ReducedPanel() {
    return (<div class="reduced-panel">
      <div class="reduced-row">
        <button class="big-btn play" classList={{ playing: isPlaying() }} onClick={togglePlay}>
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
        <input type="range" min="80" max="160" value={bpm()} onInput={(e) => setBpmValue(+e.currentTarget.value)}/>
        <span class="bpm-val">{bpm()} BPM</span>
      </div>

      <div class="preset-strip">
        <For each={Object.keys(PRESETS)}>
          {(name) => (<button class="preset-pill" classList={{ active: activePreset() === name }} onClick={() => loadPreset(name)}>
              {name}
            </button>)}
        </For>
      </div>
    </div>);
}
function ExtendedPanel() {
    return (<div class="extended-panel">
      <div class="studio-row">
        <button class="big-btn play" classList={{ playing: isPlaying() }} onClick={togglePlay}>
          {isPlaying() ? '⏸ STOP' : '▶ PLAY'}
        </button>
        <button class="big-btn drop" onClick={() => void triggerDrop()}>🚀 DROP</button>
        <button class="big-btn rand" onClick={randomizePattern}>🎲 RANDOM</button>
        <button class="big-btn clear" onClick={clearPattern}>✕ CLEAR</button>
      </div>

      <div class="knobs">
        <Knob label="TEMPO" min={80} max={160} value={bpm()} onInput={setBpmValue} fmt={(v) => `${v} BPM`}/>
        <Knob label="VOLUME" min={0} max={100} value={Math.round(volume() * 100)} onInput={(v) => setVolumeValue(v / 100)} fmt={(v) => `${v}%`}/>
        <Knob label="FILTER" min={200} max={14000} step={50} value={filter()} onInput={setFilterValue} fmt={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}kHz` : `${v}Hz`}/>
        <Knob label="REVERB" min={0} max={100} value={Math.round(reverb() * 100 / 0.7)} onInput={(v) => setReverbValue(v / 100 * 0.7)} fmt={(v) => `${v}%`}/>
      </div>

      <div class="studio-presets">
        <For each={Object.keys(PRESETS)}>
          {(name) => (<button class="preset-pill" classList={{ active: activePreset() === name }} onClick={() => loadPreset(name)}>
              {name}
            </button>)}
        </For>
      </div>

      <div class="studio-grid">
        <div class="studio-section">
          <div class="studio-title">DRUMS · BASS · LEAD</div>
          <Sequencer />
        </div>
        <div class="studio-section">
          <div class="studio-title">CHORDS · Q W E R T Y U I</div>
          <ChordPads />
        </div>
      </div>
    </div>);
}
function Knob(props) {
    return (<div class="knob">
      <label>{props.label}</label>
      <input type="range" min={props.min} max={props.max} step={props.step ?? 1} value={props.value} onInput={(e) => props.onInput(+e.currentTarget.value)}/>
      <div class="val">{props.fmt(props.value)}</div>
    </div>);
}
