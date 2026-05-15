/**
 * Bubble manager — listens to scene + music state, picks Boys to speak,
 * places SVG speech bubbles anchored to each boy.
 *
 * Strategy:
 *  - When `isPlaying`: every (random 2–5 bars) one boy speaks an idle line.
 *  - When `mood === 'drop'`: 2–3 boys speak hype/drop lines together.
 *  - When acid mode kicks in: a boy says an acid line.
 *
 * Each bubble lives ~2.4s (CSS-driven), then removes itself.
 */
import { For, createSignal, onCleanup, createEffect, on } from 'solid-js';
import { isPlaying, barCount, mood, lastDrop } from '../state';
import { BOYS } from '../boys/boys-data';
import { pickSprueche } from './sprueche';
import './bubbles.css';
let bubbleIdSeq = 0;
export function BubbleLayer() {
    const [bubbles, setBubbles] = createSignal([]);
    const add = (boyId, mood) => {
        const text = pickSprueche(boyId, mood);
        const idx = BOYS.findIndex((b) => b.id === boyId);
        const side = idx < 2 ? 'right' : idx > 2 ? 'left' : Math.random() < 0.5 ? 'left' : 'right';
        const id = ++bubbleIdSeq;
        setBubbles((prev) => [...prev, { id, boyId, text, mood, side }]);
        setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 3400);
    };
    // Random idle chatter every 1-3 bars while playing
    createEffect(on(barCount, () => {
        if (!isPlaying())
            return;
        if (Math.random() < 0.55) {
            const boy = BOYS[Math.floor(Math.random() * BOYS.length)];
            const m = mood();
            const spruchMood = m === 'acid' ? (Math.random() < 0.5 ? 'acid' : 'idle') : m === 'hype' ? 'hype' : 'idle';
            add(boy.id, spruchMood);
        }
    }));
    // On drop: 2-3 boys react
    createEffect(on(lastDrop, (t) => {
        if (!t)
            return;
        const pool = [...BOYS];
        // Always include the eggplant — he's the main
        const eggplant = pool.find((b) => b.id === 'eggplant');
        const others = pool.filter((b) => b.id !== 'eggplant').sort(() => Math.random() - 0.5);
        const speakers = [eggplant, others[0], others[1]].filter(Boolean);
        speakers.forEach((boy, i) => setTimeout(() => add(boy.id, 'drop'), 200 + i * 220));
    }));
    // On play start
    createEffect(on(isPlaying, (playing) => {
        if (!playing)
            return;
        const boy = BOYS[Math.floor(Math.random() * BOYS.length)];
        setTimeout(() => add(boy.id, 'start'), 400);
    }));
    onCleanup(() => setBubbles([]));
    return (<div class="bubble-layer">
      <For each={bubbles()}>{(b) => <SpeechBubble bubble={b}/>}</For>
    </div>);
}
function SpeechBubble(props) {
    // Compute anchor: roughly above each boy's head, based on their index in the row.
    const idx = () => BOYS.findIndex((b) => b.id === props.bubble.boyId);
    // 5 boys → spread across the stage in 5 columns
    const xPercent = () => 14 + idx() * 18; // 14, 32, 50, 68, 86 (%)
    // Bubble width scales with text length
    const textLen = () => props.bubble.text.length;
    const w = () => Math.min(220, Math.max(80, textLen() * 7 + 28));
    const h = 56;
    const tailH = 22;
    const padding = 6;
    const side = () => props.bubble.side;
    return (<div class="bubble" data-mood={props.bubble.mood} data-boy={props.bubble.boyId} style={{
            left: `${xPercent()}%`,
            bottom: '46%',
            transform: 'translateX(-50%)',
            width: `${w() + padding * 2}px`,
            height: `${h + tailH}px`,
        }}>
      <svg width={w() + padding * 2} height={h + tailH} viewBox={`0 0 ${w() + padding * 2} ${h + tailH}`}>
        {/* Tail — points down toward the boy */}
        <path class="bubble-tail" d={side() === 'left'
            ? `M ${w() * 0.32} ${h - 4} L ${w() * 0.18} ${h + tailH - 2} L ${w() * 0.46} ${h - 8} Z`
            : `M ${w() * 0.68} ${h - 4} L ${w() * 0.82} ${h + tailH - 2} L ${w() * 0.54} ${h - 8} Z`}/>
        {/* Bubble body — rounded comic shape with a couple of pinches */}
        <rect class="bubble-body" x={padding} y={4} rx={h * 0.5} ry={h * 0.5} width={w()} height={h - 8}/>
        <text class="bubble-text" x={(w() + padding * 2) / 2} y={h * 0.5 + 2} font-size={textLen() > 16 ? '12' : '14'}>
          {props.bubble.text}
        </text>
      </svg>
    </div>);
}
