/**
 * Boys Club roster. Each boy has a zone in the disco scene:
 *
 *   eggplant  — center stage, $DISCO is the DJ (behind the decks)
 *   pepe      — dance floor, front-left, dancing
 *   maus      — dance floor, front-right, dancing
 *   burns     — near the bar, sipping martini, chill
 *   landwulf  — at the bar (right side), hand raised
 *
 * `zone` controls placement; `dance` controls which keyframe animation they
 * play (dancers do big bobs, bar-folks do subtle sway).
 */
export type Zone = 'dj' | 'dancefloor-l' | 'dancefloor-r' | 'bar-side' | 'bar';

export interface BoyDef {
  id: string;
  name: string;
  color: string;
  accent: string;
  dance: 'A' | 'B' | 'C' | 'D' | 'E';
  zone: Zone;
}

export const BOYS: BoyDef[] = [
  {
    id: 'pepe',
    name: 'PEPE',
    color: '#39ff14',
    accent: '#1c6b1c',
    dance: 'A',
    zone: 'dancefloor-l',
  },
  {
    id: 'eggplant',
    name: 'DISCO',
    color: '#ff2bd6',
    accent: '#5a1873',
    dance: 'C',
    zone: 'dj',
  },
  {
    id: 'maus',
    name: 'MAUS',
    color: '#7aa3ff',
    accent: '#1f3a73',
    dance: 'B',
    zone: 'dancefloor-r',
  },
  {
    id: 'burns',
    name: 'BURNS',
    color: '#ffd24a',
    accent: '#7a4a00',
    dance: 'D',
    zone: 'bar-side',
  },
  {
    id: 'landwulf',
    name: 'LANDWULF',
    color: '#ff7a00',
    accent: '#7a3a00',
    dance: 'E',
    zone: 'bar',
  },
];

/** Resolve a boy's PNG asset. Vite serves /public/* at root. */
export function boyImage(id: string): string {
  return `/boys/${id}.png`;
}
