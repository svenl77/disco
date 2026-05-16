import { createSignal, onMount } from 'solid-js';
import { Stage } from './stage/Stage';
import { MusicPanel } from './music/MusicPanel';
import { StartOverlay } from './StartOverlay';
import { applySet } from './share/ShareBar';
import { setFromCurrentURL } from './share/serialize';

const CA = '8h4a46euwqfiZ9A3GYkiocXeu9pkNnwTaQGHgBf7pump';
const X_URL = 'https://x.com/DISCOonpump';

export function App() {
  // URL-based loading still works (paste a share link into the address bar
  // and the song loads). The visible SHARE/LOAD UI was removed — sharing
  // will be reimplemented later through a different surface.
  onMount(() => {
    const set = setFromCurrentURL();
    if (set) applySet(set);
  });

  const [copied, setCopied] = createSignal(false);

  async function copyCA() {
    try {
      await navigator.clipboard.writeText(CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      window.prompt('Copy CA', CA);
    }
  }

  return (
    <>
      <StartOverlay />
      <header class="app-header">
        <h1 class="app-title">$DISCO · BOYS CLUB 🪩</h1>
        <div class="app-subtitle">STAYIN ALIVE · ON-CHAIN · DANCE OR DIE</div>
      </header>

      <main>
        <Stage />
        <MusicPanel />
      </main>

      <footer class="app-footer">
        <div class="footer-left">
          $DISCO · BOYS CLUB ·{' '}
          <a href="https://discohedzsol.com/" target="_blank" rel="noopener">discohedzsol.com</a>
        </div>
        <div class="footer-right">
          <a class="footer-x" href={X_URL} target="_blank" rel="noopener" title="$DISCO on X">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path fill="currentColor" d="M18.244 2H21l-6.52 7.45L22 22h-6.78l-4.7-6.45L4.8 22H2l7.04-8.04L2 2h6.94l4.25 5.84L18.244 2zm-1.18 18.16h1.85L7.06 3.74H5.1l11.964 16.42z"/>
            </svg>
            <span>@DISCOonpump</span>
          </a>
          <button class="footer-ca" onClick={copyCA} title="Copy contract address">
            <span class="footer-ca-label">CA</span>
            <span class="footer-ca-addr">{CA.slice(0, 4)}…{CA.slice(-6)}</span>
            <span class="footer-ca-copy">{copied() ? '✓' : '📋'}</span>
          </button>
        </div>
      </footer>
    </>
  );
}
