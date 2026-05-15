/**
 * Bubble manager — listens to scene + music state, picks Boys to speak,
 * places SVG speech bubbles directly above each speaking boy.
 *
 * Each bubble:
 *  - Anchors to a specific .boy element via getBoundingClientRect
 *  - Stays attached even as the boy dances (re-reads position on each render)
 *  - Draws an SVG tail from its bottom edge to the boy's head, so the source
 *    of the line is unambiguous
 */
import { For, createSignal, onCleanup, createEffect, on } from 'solid-js';
import { isPlaying, barCount, mood, lastDrop } from '../state';
import { BOYS } from '../boys/boys-data';
import { pickSprueche, type BoyId, type Mood as SpruchMood } from './sprueche';
import './bubbles.css';

interface Bubble {
  id: number;
  boyId: BoyId;
  text: string;
  mood: SpruchMood;
  /** Initial horizontal offset from the boy's centre, so two simultaneous
   *  bubbles on the same boy don't perfectly overlap */
  offsetX: number;
}

let bubbleIdSeq = 0;

export function BubbleLayer() {
  const [bubbles, setBubbles] = createSignal<Bubble[]>([]);

  const add = (boyId: BoyId, m: SpruchMood) => {
    const text = pickSprueche(boyId, m);
    const id = ++bubbleIdSeq;
    const offsetX = Math.random() * 40 - 20;
    setBubbles((prev) => [...prev, { id, boyId, text, mood: m, offsetX }]);
    setTimeout(() => setBubbles((prev) => prev.filter((b) => b.id !== id)), 3400);
  };

  // Random idle chatter every bar while playing
  createEffect(
    on(barCount, () => {
      if (!isPlaying()) return;
      if (Math.random() < 0.6) {
        const boy = BOYS[Math.floor(Math.random() * BOYS.length)];
        const m = mood();
        const spruchMood: SpruchMood =
          m === 'acid' ? (Math.random() < 0.5 ? 'acid' : 'idle') : m === 'hype' ? 'hype' : 'idle';
        add(boy.id as BoyId, spruchMood);
      }
    }),
  );

  // On drop: 3 boys react (always include eggplant)
  createEffect(
    on(lastDrop, (t) => {
      if (!t) return;
      const pool = [...BOYS];
      const eggplant = pool.find((b) => b.id === 'eggplant');
      const others = pool.filter((b) => b.id !== 'eggplant').sort(() => Math.random() - 0.5);
      const speakers = [eggplant, others[0], others[1]].filter(Boolean) as typeof BOYS;
      speakers.forEach((boy, i) =>
        setTimeout(() => add(boy.id as BoyId, 'drop'), 200 + i * 220),
      );
    }),
  );

  // On play start
  createEffect(
    on(isPlaying, (playing) => {
      if (!playing) return;
      const boy = BOYS[Math.floor(Math.random() * BOYS.length)];
      setTimeout(() => add(boy.id as BoyId, 'start'), 400);
    }),
  );

  onCleanup(() => setBubbles([]));

  return (
    <div class="bubble-layer">
      <For each={bubbles()}>{(b) => <SpeechBubble bubble={b} />}</For>
    </div>
  );
}

/**
 * A single bubble. Reads the target boy's bounding box live so the bubble
 * sits directly above that boy even though the boy is dancing.
 */
function SpeechBubble(props: { bubble: Bubble }) {
  // Width scales with text length
  const textLen = () => props.bubble.text.length;
  const bubbleW = () => Math.min(220, Math.max(80, textLen() * 7 + 28));
  const bubbleH = 52;
  const tailH = 32;

  // Position relative to the .stage container, anchored over the boy.
  const [pos, setPos] = createSignal({ left: 0, top: 0, tailDx: 0 });

  function updatePos() {
    const boy = document.querySelector(`.boy[data-id="${props.bubble.boyId}"]`);
    const stage = document.querySelector('.stage');
    if (!boy || !stage) return;
    const b = boy.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const boyCenterX = b.left + b.width / 2 - s.left;
    const boyHeadY = b.top - s.top;

    // Bubble sits above the boy's head, but never higher than 8px from the
    // stage's top edge — clamp so it stays visible even with tall boys.
    let top = boyHeadY - (bubbleH + tailH) - 6;
    if (top < 8) top = 8;
    let left = boyCenterX + props.bubble.offsetX - bubbleW() / 2;
    // Keep bubble fully on-stage horizontally
    const stageW = s.width;
    if (left < 6) left = 6;
    if (left + bubbleW() + 12 > stageW - 6) left = stageW - bubbleW() - 18;

    // Tail dx: how far the tail tip is from the bubble's center, so it lands on the boy's head
    const bubbleCenterX = left + (bubbleW() + 12) / 2;
    const tailDx = Math.max(-bubbleW() / 2 + 18, Math.min(bubbleW() / 2 - 18, boyCenterX - bubbleCenterX));
    setPos({ left, top, tailDx });
  }

  // Solid renders this once; the dance keyframes move the boy, so re-poll
  // a few times in the first half-second so the tail tracks the boy as it bobs.
  updatePos();
  const handle = setInterval(updatePos, 80);
  setTimeout(() => clearInterval(handle), 3500);
  onCleanup(() => clearInterval(handle));

  const padding = 6;
  const totalW = () => bubbleW() + padding * 2;
  const totalH = bubbleH + tailH;

  return (
    <div
      class="bubble"
      data-mood={props.bubble.mood}
      data-boy={props.bubble.boyId}
      style={{
        left: `${pos().left}px`,
        top: `${pos().top}px`,
        width: `${totalW()}px`,
        height: `${totalH}px`,
      }}
    >
      <svg width={totalW()} height={totalH} viewBox={`0 0 ${totalW()} ${totalH}`}>
        {/* Tail — wedge that points to the boy's head */}
        <path
          class="bubble-tail"
          d={`
            M ${totalW() / 2 - 14} ${bubbleH - 4}
            L ${totalW() / 2 + pos().tailDx} ${totalH - 2}
            L ${totalW() / 2 + 14} ${bubbleH - 4}
            Z
          `}
        />
        {/* Bubble body */}
        <rect
          class="bubble-body"
          x={padding}
          y={4}
          rx={bubbleH * 0.5}
          ry={bubbleH * 0.5}
          width={bubbleW()}
          height={bubbleH - 8}
        />
        <text
          class="bubble-text"
          x={totalW() / 2}
          y={bubbleH * 0.5 + 2}
          font-size={textLen() > 16 ? '12' : '14'}
        >
          {props.bubble.text}
        </text>
      </svg>
    </div>
  );
}
