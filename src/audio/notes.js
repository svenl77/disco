// MIDI note names → frequency lookup. C1..B6 covered.
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_FREQ = (() => {
    const map = {};
    for (let o = 1; o <= 6; o++) {
        for (let i = 0; i < 12; i++) {
            const midi = (o + 1) * 12 + i;
            map[NOTE_NAMES[i] + o] = 440 * Math.pow(2, (midi - 69) / 12);
        }
    }
    return map;
})();
export const BASS_NOTES = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'C3', 'D3'];
export const LEAD_NOTES = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'];
export function freqOf(note) {
    return NOTE_FREQ[note] ?? 220;
}
