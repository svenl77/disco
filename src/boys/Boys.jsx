/**
 * The Boys Club row — five dancing characters.
 *
 * Uses real PNG cutouts (from /boys/<id>.png) if available, otherwise renders
 * a placeholder SVG so we can develop the layout before the assets land.
 *
 * The center boy is the "main" and triggers a DROP when clicked.
 */
import { For } from 'solid-js';
import { BOYS, boyImage } from './boys-data';
import { triggerDrop } from '../state';
import './boys.css';
const SIZE_BY_POSITION = ['boy-size-s', 'boy-size-m', 'boy-size-l', 'boy-size-m', 'boy-size-s'];
export function Boys() {
    return (<>
      <div class="boys">
        <For each={BOYS}>{(boy, i) => <Boy boy={boy} idx={i()}/>}</For>
      </div>
      <div class="click-hint">🍆 KLICK BOYS = DROP</div>
    </>);
}
function Boy(props) {
    const img = () => boyImage(props.boy.id);
    const sizeClass = () => SIZE_BY_POSITION[props.idx] ?? 'boy-size-m';
    const isCenter = () => props.idx === 2;
    function onClick(e) {
        e.preventDefault();
        void triggerDrop();
        const el = e.currentTarget;
        el.classList.remove('pop');
        void el.offsetWidth;
        el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 520);
    }
    return (<div class={`boy ${sizeClass()} ${isCenter() ? 'center' : ''}`} data-dance={props.boy.dance} data-id={props.boy.id} style={{ '--boy-color': props.boy.color }} onClick={onClick} role="button" aria-label={`${props.boy.name} — click to drop`} tabIndex={0}>
      <img class="boy-img" src={img()} alt={props.boy.name} draggable={false} onError={(e) => {
            // Fallback to placeholder SVG if PNG missing.
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.removeAttribute('hidden');
        }}/>
      <span hidden>
        <PlaceholderBoy color={props.boy.color} accent={props.boy.accent}/>
      </span>
    </div>);
}
/**
 * Placeholder SVG — same eggplant character from the legacy app, recolored per boy.
 * Stays useful as the fallback even after image cutouts land.
 */
function PlaceholderBoy(props) {
    return (<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">
      {/* Stem */}
      <path d="M68,42 Q82,10 100,24 Q118,10 132,42 Q148,24 144,56 Q132,64 116,56 Q100,66 84,56 Q68,64 56,56 Q52,24 68,42 Z" fill="#3aa84a" stroke="#1d6128" stroke-width="3"/>
      <path d="M100,24 L100,60" stroke="#1d6128" stroke-width="2.5" fill="none"/>
      {/* Body */}
      <ellipse cx="100" cy="146" rx="74" ry="92" fill={props.color} stroke={props.accent} stroke-width="3.5"/>
      <ellipse cx="76" cy="120" rx="22" ry="44" fill="rgba(255,255,255,0.18)"/>
      <ellipse cx="132" cy="182" rx="16" ry="28" fill="rgba(0,0,0,0.18)"/>
      {/* Headphones */}
      <path d="M48,94 Q100,28 152,94" stroke="#1a1a1a" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse cx="44" cy="102" rx="16" ry="20" fill="#1a1a1a" stroke="#000" stroke-width="2"/>
      <ellipse cx="156" cy="102" rx="16" ry="20" fill="#1a1a1a" stroke="#000" stroke-width="2"/>
      <ellipse cx="44" cy="102" rx="8" ry="12" fill={props.color}/>
      <ellipse cx="156" cy="102" rx="8" ry="12" fill={props.color}/>
      {/* Eye */}
      <circle cx="100" cy="118" r="38" fill="#fff" stroke={props.accent} stroke-width="3.5"/>
      <circle cx="100" cy="124" r="16" fill="#0a0a0a"/>
      <circle cx="108" cy="116" r="5.5" fill="#fff"/>
      <circle cx="94" cy="128" r="2.5" fill="#fff"/>
      {/* Mouth */}
      <path d="M66,172 Q100,212 134,172 Q134,194 100,206 Q66,194 66,172 Z" fill="#e23a6a" stroke="#5a1233" stroke-width="2.5"/>
      <path d="M82,180 L86,196 L90,180 Z" fill="#fff"/>
      <path d="M110,180 L114,196 L118,180 Z" fill="#fff"/>
      <ellipse cx="100" cy="192" rx="14" ry="6" fill="#ff7aa8"/>
    </svg>);
}
