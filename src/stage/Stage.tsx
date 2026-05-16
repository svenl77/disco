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
import { Fireworks } from './Fireworks';
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

      {/* DJ stage at back centre — raised platform where Eggplant stands */}
      <div class="dj-stage" />
      {/* DJ pult — front view of the DJ table.
          Layered from back to front:
            .dj-pult-top      — narrow surface seen as a thin band
            two turntables ON that surface (flat ovals, only their top edge)
            the mixer between them
            .dj-pult-front    — the big front face of the table with $DISCO logo */}
      <div class="dj-pult">
        <div class="dj-label">$DISCO</div>

        {/* Left turntable — housing box + thin vinyl silhouette + tonearm */}
        <div class="deck deck-l">
          <div class="deck-vinyl" />
          <div class="tonearm tonearm-l">
            <div class="tonearm-arm" />
            <div class="tonearm-pivot" />
            <div class="tonearm-tip" />
          </div>
        </div>

        {/* Mixer in the middle */}
        <div class="mixer">
          <div class="mixer-knobs">
            <span class="mixer-knob" />
            <span class="mixer-knob" />
            <span class="mixer-knob" />
            <span class="mixer-knob" />
            <span class="mixer-knob" />
            <span class="mixer-knob" />
          </div>
          <div class="mixer-vu">
            <span /><span /><span /><span /><span />
          </div>
        </div>

        {/* Right turntable */}
        <div class="deck deck-r">
          <div class="deck-vinyl" />
          <div class="tonearm tonearm-r">
            <div class="tonearm-arm" />
            <div class="tonearm-pivot" />
            <div class="tonearm-tip" />
          </div>
        </div>

        {/* Table top band — between equipment and front face */}
        <div class="dj-pult-top" />
        {/* The big front-facing panel with $DISCO logo — rendered LAST so it's on top */}
        <div class="dj-pult-front" />
      </div>
      <div class="speaker stack-l" />
      <div class="speaker stack-r" />

      {/* === THE BAR === composed of layers from back to front:
            .bar-glow         — ambient warm light bathing the area (z=0)
            .bar-backwall     — back wall behind the bottles (z=1)
            .bar-neon         — flickering BAR sign on the wall (z=2)
            .bar-shelves      — two horizontal shelves with bottles (z=3)
            Andy stands here as bartender (layer 4 via his boy zone)
            .bar-glasses + .bar-tap + .bar-drink — counter-top items (z=6)
            .bar-counter-top  — narrow surface above the front face (z=5)
            .bar-counter-front — big audience-facing panel (z=5)
            .bar-stool        — barstool in front of the counter (z=6)  */}
      <div class="bar">
        <div class="bar-glow" />
        <div class="bar-backwall" />
        <div class="bar-neon">BAR</div>
        <div class="bar-shelves">
          <div class="bar-shelf bar-shelf-top">
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
          </div>
          <div class="bar-shelf bar-shelf-bot">
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
            <span class="bottle" />
          </div>
        </div>
        <div class="bar-glasses">
          <span class="glass" />
          <span class="glass" />
          <span class="glass" />
          <span class="glass" />
          <span class="glass" />
          <span class="glass" />
          <span class="glass" />
          <span class="glass" />
        </div>
        <div class="bar-tap" />
        <div class="bar-drink" />
        <div class="bar-counter-top" />
        <div class="bar-counter-front" />
        <div class="bar-stool" />
      </div>

      {/* Perspective dance floor grid */}
      <div class="floor-3d" />

      {/* Two laser stations — one on each speaker.
          Each fires 3 beams across the room creating a cross pattern. */}
      <div class="dj-lasers">
        <div class="laser-station left">
          <div class="laser laser-a" />
          <div class="laser laser-b" />
          <div class="laser laser-c" />
        </div>
        <div class="laser-station right">
          <div class="laser laser-a" />
          <div class="laser laser-b" />
          <div class="laser laser-c" />
        </div>
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

      {/* Fireworks layer (behind boys, above back wall) */}
      <Fireworks />

      <DiscoBall />
      <div class="dance-floor-glow" />
      <Boys />
      <BubbleLayer />
    </section>
  );
}
