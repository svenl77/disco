/**
 * Share / save controls — viral surface for sharing a full song.
 *
 *   SHARE → copy share URL to clipboard (whole bank + song packed in #s=...)
 *   SAVE  → download the song as a .json
 *   LOAD  → paste a share URL or JSON to import a song
 */
import { createSignal } from 'solid-js';
import {
  bpm,
  setBpmValue,
  mood,
  setMood,
  seq,
  song,
  patternBank,
  setSong,
  setPatternBank,
  setPatternsVersion,
} from '../state';
import { decodeSet, downloadJSON, shareURL, type DiscoSet } from './serialize';
import './share.css';

export function ShareBar() {
  const [flash, setFlash] = createSignal<string | null>(null);

  const buildSet = (): Omit<DiscoSet, 'v'> => ({
    bpm: bpm(),
    bank: patternBank(),
    song: song(),
    mood: mood(),
  });

  async function copyLink() {
    const url = shareURL(buildSet());
    try {
      await navigator.clipboard.writeText(url);
      showFlash('LINK COPIED 🔗');
    } catch {
      window.prompt('Copy this share URL', url);
    }
  }

  function saveJson() {
    downloadJSON(buildSet());
    showFlash('SAVED ⬇');
  }

  async function pasteLoad() {
    const text = await navigator.clipboard.readText().catch(() => '');
    const candidate = text || window.prompt('Paste share URL or JSON') || '';
    if (!candidate) return;

    let encoded: string | null = null;
    const urlMatch = candidate.match(/[#&?]s=([A-Za-z0-9_-]+)/);
    if (urlMatch) encoded = urlMatch[1];
    else if (/^[A-Za-z0-9_-]+$/.test(candidate.trim())) encoded = candidate.trim();

    let set: DiscoSet | null = encoded ? decodeSet(encoded) : null;
    if (!set) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed?.v === 1 || parsed?.v === 2) set = parsed;
      } catch { /* not JSON either */ }
    }
    if (!set) {
      showFlash('NOT A SET ⚠');
      return;
    }

    applySet(set);
    showFlash('SET LOADED 🪩');
  }

  function showFlash(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1800);
  }

  return (
    <div class="share-bar">
      <button class="share-btn" onClick={copyLink}>🔗 SHARE</button>
      <button class="share-btn" onClick={saveJson}>⬇ SAVE</button>
      <button class="share-btn" onClick={pasteLoad}>📋 LOAD</button>
      {flash() && <span class="share-flash">{flash()}</span>}
    </div>
  );
}

/** Apply a decoded set to the global state */
export function applySet(set: DiscoSet | null): void {
  if (!set) return;
  setBpmValue(set.bpm);
  // Replace bank + song
  setPatternBank(set.bank);
  seq.bank = set.bank;
  setSong(set.song);
  seq.song = set.song;
  seq.loadSlot(0);
  setPatternsVersion((v) => v + 1);
  if (set.mood === 'acid') setMood('acid');
  else setMood('groove');
}
