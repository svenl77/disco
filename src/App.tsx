import { Stage } from './stage/Stage';
import { MusicPanel } from './music/MusicPanel';

export function App() {
  return (
    <>
      <header class="app-header">
        <h1 class="app-title">$DISCO · BOYS CLUB 🪩</h1>
        <div class="app-subtitle">STAYIN ALIVE · ON-CHAIN · DANCE OR DIE</div>
      </header>

      <main>
        <Stage />
        <MusicPanel />
      </main>

      <footer class="app-footer">
        $DISCO · BOYS CLUB · <a href="https://discohedzsol.com/" target="_blank" rel="noopener">discohedzsol.com</a>
      </footer>
    </>
  );
}
