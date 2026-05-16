/**
 * Fireworks layer — visible behind the boys but above the back wall.
 *
 * Each click of the disco ball spawns 4 bursts at random positions on the
 * upper portion of the stage. A burst = 14 colored particles radiating
 * outward from a center point, fading as they expand.
 */
import { For, createSignal, createEffect, on, onCleanup } from 'solid-js';
import { lastBallClick } from '../state';

interface Burst {
  id: number;
  x: number;       // % of stage width
  y: number;       // % of stage height (upper half)
  color: string;
  size: number;    // px, radius the particles travel
  delay: number;   // ms, staggered ignition
}

const PALETTE = ['#ff2bd6', '#00f0ff', '#fff200', '#39ff14', '#ff7a00', '#b346c8'];
const PARTICLES_PER_BURST = 16;

let nextId = 1;

export function Fireworks() {
  const [bursts, setBursts] = createSignal<Burst[]>([]);

  createEffect(
    on(lastBallClick, (t) => {
      if (!t) return;
      // 4 bursts at random positions across the upper half of the back wall
      const newBursts: Burst[] = Array.from({ length: 4 }, (_, i) => ({
        id: nextId++,
        x: 10 + Math.random() * 80,    // 10..90 %
        y: 8 + Math.random() * 35,     // 8..43 % (upper / back-wall area)
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        size: 80 + Math.random() * 60,
        delay: i * 140,
      }));
      setBursts((prev) => [...prev, ...newBursts]);
      const removeIds = new Set(newBursts.map((b) => b.id));
      setTimeout(() => {
        setBursts((prev) => prev.filter((b) => !removeIds.has(b.id)));
      }, 2200);
    }),
  );

  onCleanup(() => setBursts([]));

  return (
    <div class="fireworks-layer" aria-hidden="true">
      <For each={bursts()}>{(b) => <Burst burst={b} />}</For>
    </div>
  );
}

function Burst(props: { burst: Burst }) {
  const particles = Array.from({ length: PARTICLES_PER_BURST });
  return (
    <div
      class="firework"
      style={{
        left: `${props.burst.x}%`,
        top: `${props.burst.y}%`,
        color: props.burst.color,
        '--burst-size': `${props.burst.size}px`,
        'animation-delay': `${props.burst.delay}ms`,
      }}
    >
      <For each={particles}>
        {(_, i) => (
          <span
            class="firework-particle"
            style={{
              '--angle': `${(i() / PARTICLES_PER_BURST) * 360}deg`,
              'animation-delay': `${props.burst.delay}ms`,
            }}
          />
        )}
      </For>
      {/* center flash */}
      <span class="firework-flash" style={{ 'animation-delay': `${props.burst.delay}ms` }} />
    </div>
  );
}
