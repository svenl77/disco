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
  // Eggplant is the DJ — stands BEHIND the pult. His bottom % is chosen so
  // that the pult's front-face hides his legs and the equipment band sits
  // at his hip level. The pult is z-index 5; Eggplant is layer 4.
  'dj':            { size: 'm',  left: '50%', bottom: '30%', layer: 4 },
  // Two front dancers, OUTSIDE the pult area horizontally (pult spans ~36-64%)
  'dancefloor-l':  { size: 'm',  left: '15%', bottom: '6%',  layer: 7 },
  'dancefloor-r':  { size: 'm',  left: '30%', bottom: '6%',  layer: 7 },
  // Andy stands BEHIND the bar counter. Bar is now in the back-right
  // corner with perspective, so Andy is FARTHER from camera → smaller (xs).
  // His bottom % aligns with the new (higher) counter-top inside the bar.
  'bar-keep':      { size: 's',  left: '83%', bottom: '37%', layer: 4 },
  // Landwulf hangs IN FRONT of the bar as a customer — he's closer to
  // camera than Andy, so he's bigger (m). Sized like the dance-floor boys.
  'bar':           { size: 'm',  left: '70%', bottom: '6%',  layer: 6 },
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
