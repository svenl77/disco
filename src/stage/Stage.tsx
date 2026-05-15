import { For } from 'solid-js';
import { DiscoBall } from './DiscoBall';
import { Boys } from '../boys/Boys';
import { BubbleLayer } from '../bubbles/BubbleLayer';
import { mood } from '../state';
import './stage.css';

// 36 reflective light spots arranged in a ring radiating from the ball
const SPOT_COUNT = 36;
const SPOT_TINTS = ['', 'tinted-pink', 'tinted-cyan', '', 'tinted-yellow', '', ''];

function spotStyle(i: number) {
  const angle = (i / SPOT_COUNT) * 360;
  // Variable radius so spots cover wall + floor, not a perfect circle
  const radius = 180 + ((i * 53) % 240);
  return {
    transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`,
    'animation-delay': `${(i * 0.07) % 1.2}s`,
    'animation-duration': `${0.7 + ((i * 0.13) % 0.9)}s`,
  };
}

export function Stage() {
  return (
    <section class="stage" aria-label="Boys Club Disco stage" data-mood={mood()}>
      {/* Back wall + DJ setup */}
      <div class="room-back" />
      <div class="dj-booth" />
      <div class="speaker left" />
      <div class="speaker right" />

      {/* Perspective floor with neon grid */}
      <div class="floor-3d" />

      {/* DJ laser beams aimed at the ball */}
      <div class="dj-lasers">
        <div class="laser laser-1" />
        <div class="laser laser-2" />
        <div class="laser laser-3" />
        <div class="laser laser-4" />
      </div>

      {/* Reflective light spots over wall + floor */}
      <div class="reflective-spots">
        <For each={Array.from({ length: SPOT_COUNT })}>
          {(_, i) => (
            <span
              class={`spot ${SPOT_TINTS[i() % SPOT_TINTS.length]}`}
              style={spotStyle(i())}
            />
          )}
        </For>
      </div>

      <DiscoBall />
      <div class="dance-floor" />
      <Boys />
      <BubbleLayer />
    </section>
  );
}
