/**
 * The stage. Composed of zones, each with its own role:
 *
 *   .room-back   — back wall + ceiling neon strip
 *   .dj-stage    — raised platform, centre back, $DISCO is DJ on top
 *   .dj-pult     — turntable/mixer in front of the DJ
 *   .speakers    — flank the stage, pulse on beat
 *   .bar         — counter on the right, bottles + stool
 *   .floor-3d    — perspective dance floor with neon grid
 *   .dj-lasers   — colored beams from the booth sweeping across the floor
 *   .reflective-spots — small white spots radiating from the ball
 *   .ball        — disco ball overhead
 *   .boys-zones  — the five boys in their respective zones
 *   .bubble-layer — comic speech bubbles
 *
 * Light direction is consistent: beams originate at the DJ booth (back), hit
 * the disco ball, and the ball scatters white reflective spots in all
 * directions — the way a real disco room works.
 */
import { For, createSignal, createEffect, on } from 'solid-js';
import { DiscoBall } from './DiscoBall';
import { Boys } from '../boys/Boys';
import { BubbleLayer } from '../bubbles/BubbleLayer';
import { mood, lastBoyAction } from '../state';
import './stage.css';

// 32 reflective light spots arranged in a ring around the disco ball
const SPOT_COUNT = 32;
const SPOT_TINTS = ['', 'tinted-pink', 'tinted-cyan', '', 'tinted-yellow', '', ''];

function spotStyle(i: number) {
  const angle = (i / SPOT_COUNT) * 360;
  const radius = 200 + ((i * 53) % 260);
  return {
    transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)`,
    'animation-delay': `${(i * 0.07) % 1.2}s`,
    'animation-duration': `${0.7 + ((i * 0.13) % 0.9)}s`,
  };
}

export function Stage() {
  // Track which boy was last clicked so we can flash the stage in their colour briefly
  const [activeBoy, setActiveBoy] = createSignal<string | null>(null);
  createEffect(
    on(lastBoyAction, (action) => {
      if (!action) return;
      setActiveBoy(action.boyId);
      setTimeout(() => setActiveBoy((cur) => (cur === action.boyId ? null : cur)), 700);
    }),
  );

  return (
    <section
      class="stage"
      aria-label="Boys Club Disco stage"
      data-mood={mood()}
      data-active-boy={activeBoy() ?? undefined}
      style={{ '--flash-color': lastBoyAction()?.flash ?? 'transparent' }}
    >
      {/* Back wall + ceiling */}
      <div class="room-back" />

      {/* DJ stage at back centre — raised platform, decks, speakers */}
      <div class="dj-stage">
        <div class="dj-pult">
          <div class="deck deck-l" />
          <div class="deck deck-r" />
          <div class="mixer" />
          <div class="dj-label">$DISCO</div>
        </div>
      </div>
      <div class="speaker stack-l" />
      <div class="speaker stack-r" />

      {/* The bar on the right side */}
      <div class="bar">
        <div class="bar-bottles" />
        <div class="bar-counter" />
        <div class="bar-stool" />
        <div class="bar-glow" />
      </div>

      {/* Perspective dance floor grid */}
      <div class="floor-3d" />

      {/* DJ lasers — sweep across the dance floor from the booth */}
      <div class="dj-lasers">
        <div class="laser laser-pink" />
        <div class="laser laser-cyan" />
        <div class="laser laser-yellow" />
        <div class="laser laser-green" />
        <div class="laser laser-orange" />
        <div class="laser laser-eggplant" />
      </div>

      {/* Reflective spots — white light bounces off the disco ball outward */}
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
      <div class="dance-floor-glow" />
      <Boys />
      <BubbleLayer />
    </section>
  );
}
