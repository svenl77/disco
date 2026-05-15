// Order = visual left → right on stage. Eggplant in the center (he's the $DISCO hero).
export const BOYS = [
    {
        id: 'pepe',
        name: 'PEPE',
        color: '#39ff14',
        accent: '#1c6b1c',
        dance: 'A',
        delayBeats: 0,
        scale: 1.0,
    },
    {
        id: 'hippie',
        name: 'HIPPIE',
        color: '#b346c8',
        accent: '#3d0a4f',
        dance: 'E',
        delayBeats: 0.75,
        scale: 1.05,
    },
    {
        id: 'eggplant',
        name: 'EGGPLANT',
        color: '#ff2bd6',
        accent: '#5a1873',
        dance: 'C',
        delayBeats: -0.5,
        scale: 1.1,
    },
    {
        id: 'maus',
        name: 'BIZ MAUS',
        color: '#7aa3ff',
        accent: '#1f3a73',
        dance: 'B',
        delayBeats: 0.25,
        scale: 1.0,
    },
    {
        id: 'burns',
        name: 'BURNS',
        color: '#ffd24a',
        accent: '#7a4a00',
        dance: 'D',
        delayBeats: 1,
        scale: 0.95,
    },
];
/** Resolve a boy's PNG asset. Vite serves /public/* at root. */
export function boyImage(id) {
    return `/boys/${id}.png`;
}
