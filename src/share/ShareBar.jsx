/**
 * Share / save controls — viral surface for sharing a set.
 *
 *   COPY LINK → copy the share URL to clipboard
 *   SAVE JSON → download the set as a .json file
 *   PASTE LOAD → paste a share URL or JSON to load it
 */
import { createSignal } from 'solid-js';
import { bpm, setBpmValue, activePreset, setActivePreset, mood, setMood, seq, setPatternsVersion, } from '../state';
import { decodeSet, downloadJSON, shareURL } from './serialize';
import './share.css';
export function ShareBar() {
    const [flash, setFlash] = createSignal(null);
    const buildSet = () => ({
        bpm: bpm(),
        patterns: seq.patterns,
        preset: activePreset(),
        mood: mood(),
    });
    async function copyLink() {
        const url = shareURL(buildSet());
        try {
            await navigator.clipboard.writeText(url);
            showFlash('LINK COPIED 🔗');
        }
        catch {
            // Fallback for non-https
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
        if (!candidate)
            return;
        let encoded = null;
        const urlMatch = candidate.match(/[#&?]s=([A-Za-z0-9_-]+)/);
        if (urlMatch)
            encoded = urlMatch[1];
        else if (/^[A-Za-z0-9_-]+$/.test(candidate.trim()))
            encoded = candidate.trim();
        let set = encoded ? decodeSet(encoded) : null;
        if (!set) {
            try {
                const parsed = JSON.parse(candidate);
                if (parsed?.v === 1)
                    set = parsed;
            }
            catch { /* not JSON either */ }
        }
        if (!set) {
            showFlash('NOT A SET ⚠');
            return;
        }
        applySet(set);
        showFlash('SET LOADED 🪩');
    }
    function showFlash(msg) {
        setFlash(msg);
        setTimeout(() => setFlash(null), 1800);
    }
    return (<div class="share-bar">
      <button class="share-btn" onClick={copyLink}>🔗 SHARE</button>
      <button class="share-btn" onClick={saveJson}>⬇ SAVE</button>
      <button class="share-btn" onClick={pasteLoad}>📋 LOAD</button>
      {flash() && <span class="share-flash">{flash()}</span>}
    </div>);
}
/** Apply a decoded set to the global state — exported for URL-bootstrap too. */
export function applySet(set) {
    if (!set)
        return;
    setBpmValue(set.bpm);
    seq.patterns = {
        kick: set.patterns.kick.slice(),
        snare: set.patterns.snare.slice(),
        clap: set.patterns.clap.slice(),
        hatC: set.patterns.hatC.slice(),
        hatO: set.patterns.hatO.slice(),
        cowbell: set.patterns.cowbell.slice(),
        bass: set.patterns.bass.slice(),
        lead: set.patterns.lead.slice(),
    };
    setActivePreset(set.preset);
    setPatternsVersion((v) => v + 1);
    if (set.mood === 'acid')
        setMood('acid');
    else
        setMood('groove');
}
