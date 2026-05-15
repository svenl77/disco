import { onMount } from 'solid-js';
import { Stage } from './stage/Stage';
import { MusicPanel } from './music/MusicPanel';
import { ShareBar, applySet } from './share/ShareBar';
import { setFromCurrentURL } from './share/serialize';
export function App() {
    onMount(() => {
        const set = setFromCurrentURL();
        if (set)
            applySet(set);
    });
    return (<>
      <header class="app-header">
        <h1 class="app-title">$DISCO · BOYS CLUB 🪩</h1>
        <div class="app-subtitle">STAYIN ALIVE · ON-CHAIN · DANCE OR DIE</div>
      </header>

      <main>
        <Stage />
        <MusicPanel />
        <ShareBar />
      </main>

      <footer class="app-footer">
        $DISCO · BOYS CLUB · <a href="https://discohedzsol.com/" target="_blank" rel="noopener">discohedzsol.com</a>
      </footer>
    </>);
}
