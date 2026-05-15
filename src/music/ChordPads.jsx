/**
 * 8 chord pads — Cm9 / Fm7 / A#maj7 / Gm7 / Eb6 / Dm9 / Abmaj9 / Bb7.
 * Click triggers a 5-voice supersaw chord through the shared FX bus.
 * Keys Q W E R T Y U I trigger them via global keydown.
 */
import { For, createSignal, onCleanup, onMount } from 'solid-js';
import { audio } from '../state';
const CHORDS = [
    { name: 'Cm9', notes: ['C3', 'D#3', 'G3', 'A#3', 'D4'], key: 'q' },
    { name: 'Fm7', notes: ['F3', 'G#3', 'C4', 'D#4', 'F4'], key: 'w' },
    { name: 'A#maj7', notes: ['A#2', 'D3', 'F3', 'A3', 'C4'], key: 'e' },
    { name: 'Gm7', notes: ['G3', 'A#3', 'D4', 'F4', 'G4'], key: 'r' },
    { name: 'Eb6', notes: ['D#3', 'G3', 'A#3', 'C4', 'D#4'], key: 't' },
    { name: 'Dm9', notes: ['D3', 'F3', 'A3', 'C4', 'E4'], key: 'y' },
    { name: 'Abmaj9', notes: ['G#2', 'C3', 'D#3', 'G3', 'A#3'], key: 'u' },
    { name: 'Bb7', notes: ['A#2', 'D3', 'F3', 'G#3', 'C4'], key: 'i' },
];
export function ChordPads() {
    const [pressed, setPressed] = createSignal(null);
    async function trigger(c) {
        await audio.init();
        const freqs = c.notes.map((n) => audio.freqOf(n));
        audio.chord(audio.ctx.currentTime, freqs, 1.6, 0.45);
        setPressed(c.name);
        setTimeout(() => setPressed((p) => (p === c.name ? null : p)), 220);
    }
    function onKey(e) {
        if (e.repeat)
            return;
        const target = e.target;
        if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName))
            return;
        const chord = CHORDS.find((c) => c.key === e.key.toLowerCase());
        if (chord) {
            e.preventDefault();
            void trigger(chord);
        }
    }
    onMount(() => document.addEventListener('keydown', onKey));
    onCleanup(() => document.removeEventListener('keydown', onKey));
    return (<div class="chord-grid">
      <For each={CHORDS}>
        {(c) => (<button class="chord-pad" classList={{ active: pressed() === c.name }} onClick={() => trigger(c)}>
            <span class="chord-name">{c.name}</span>
            <span class="chord-key">[{c.key.toUpperCase()}]</span>
          </button>)}
      </For>
    </div>);
}
