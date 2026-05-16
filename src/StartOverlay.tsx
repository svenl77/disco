/**
 * StartOverlay — shown once on first page load.
 *
 * Browsers block autoplay-with-sound until the user makes a gesture, so
 * we surface that gesture as a single "ENTER THE CLUB" tap which:
 *   - initialises the Web Audio context
 *   - starts the seeded progressive-house song from slot A
 *   - fades the overlay out
 *
 * After the first tap the overlay stays hidden for the rest of the session.
 */
import { createSignal, Show } from 'solid-js';
import { togglePlay, isPlaying } from './state';

export function StartOverlay() {
  const [entered, setEntered] = createSignal(false);
  const [closing, setClosing] = createSignal(false);

  async function enter() {
    if (entered()) return;
    setClosing(true);
    // Fade then remove
    setTimeout(() => setEntered(true), 600);
    // Start playback (this also init's the AudioContext under the user gesture)
    if (!isPlaying()) {
      await togglePlay();
    }
  }

  return (
    <Show when={!entered()}>
      <div
        class="start-overlay"
        classList={{ closing: closing() }}
        onClick={enter}
        role="button"
        aria-label="Enter the club"
      >
        <div class="start-ball">
          <div class="start-ball-glow" />
          <div class="start-ball-mer" />
        </div>
        <h1 class="start-title">$DISCO · BOYS CLUB</h1>
        <p class="start-sub">A boys-club disco machine</p>
        <button class="start-btn" onClick={enter}>
          <span>▶</span> ENTER THE CLUB
        </button>
        <p class="start-hint">🎧 Headphones recommended</p>
      </div>
    </Show>
  );
}
