/**
 * Boys layout — each boy lives in a `zone` rather than a flat row.
 *
 *   - DJ booth         (eggplant) — back centre, behind decks, on stage
 *   - Dance floor L    (pepe)     — front-left, on the floor
 *   - Dance floor R    (maus)     — front-right
 *   - Bar side         (burns)    — mid-right, sipping
 *   - Bar              (landwulf) — far right, at the counter
 *
 * Position is absolute within `.stage`, so each boy has its own anchor and the
 * floor's perspective grid stays consistent.
 */
import { For } from 'solid-js';
import { BOYS, boyImage, type Zone } from './boys-data';
import { triggerBoyAction } from '../state';
import './boys.css';

const ZONE_CONFIG: Record<Zone, {
  size: 'xs' | 's' | 'm' | 'l';
  left: string;
  bottom: string;
  layer: number; // higher = in front
}> = {
  // Eggplant is the DJ — bottom % = top of dj-stage so his feet land on the platform.
  // Slightly smaller because he's "deeper into the scene" + on a raised platform.
  'dj':            { size: 'm',  left: '50%', bottom: '54%', layer: 4 },
  // Two dancers — closer to camera, bigger
  'dancefloor-l':  { size: 'l',  left: '24%', bottom: '6%',  layer: 7 },
  'dancefloor-r':  { size: 'l',  left: '44%', bottom: '6%',  layer: 7 },
  // Burns chills mid-right near the bar, mid-depth, mid-size
  'bar-side':      { size: 'm',  left: '70%', bottom: '8%',  layer: 6 },
  // Landwulf at the bar, far right
  'bar':           { size: 'm',  left: '88%', bottom: '12%', layer: 6 },
};

export function Boys() {
  return (
    <div class="boys-zones">
      <For each={BOYS}>{(boy) => <Boy boy={boy} />}</For>
    </div>
  );
}

function Boy(props: { boy: (typeof BOYS)[number] }) {
  const cfg = () => ZONE_CONFIG[props.boy.zone];
  const isDJ = () => props.boy.id === 'eggplant';

  function onClick(e: MouseEvent) {
    e.preventDefault();
    void triggerBoyAction(props.boy.id);
    const el = e.currentTarget as HTMLElement;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 520);
  }

  return (
    <div
      class={`boy boy-${cfg().size} zone-${props.boy.zone} ${isDJ() ? 'dj' : ''}`}
      data-dance={props.boy.dance}
      data-id={props.boy.id}
      style={{
        left: cfg().left,
        bottom: cfg().bottom,
        'z-index': cfg().layer.toString(),
        '--boy-color': props.boy.color,
      }}
      onClick={onClick}
      role="button"
      aria-label={`${props.boy.name} — click to drop`}
      tabIndex={0}
    >
      <img class="boy-img" src={boyImage(props.boy.id)} alt={props.boy.name} draggable={false} />
    </div>
  );
}
