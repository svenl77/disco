/**
 * The Song Timeline — vinyl records arranged in playback order.
 *
 * Each pattern slot is a black vinyl with a coloured center label that
 * shows the pattern ID and name. The vinyl that is CURRENTLY PLAYING
 * spins (1.4s/rev). A '+' record at the end lets you add new slots.
 *
 *   ( A )  ( B )  ( C )  ( D )  ( + )
 *   INTRO  VERSE  CHORUS DROP   create
 */
import { For, Show, createSignal } from 'solid-js';
import {
  song,
  patternBank,
  playingSlotIndex,
  jumpToSongSlot,
  setSlotPattern,
  setSlotBars,
  removeSongSlot,
  selectPattern,
  isPlaying,
  togglePlay,
  createNewRecord,
  playbackMode,
  setPlaybackMode,
  editingPatternId,
} from '../state';
import { PATTERN_COLORS, PATTERN_IDS, type PatternId } from '../audio/song';

interface Props {
  /** Show inline editing controls (bars +/-, pattern picker, remove). */
  editable?: boolean;
}

export function TimelineView(props: Props) {
  return (
    <div class="timeline-wrap" data-mode={playbackMode()}>
      <div class="timeline-head">
        <button class="timeline-play" classList={{ playing: isPlaying() }} onClick={togglePlay}>
          {isPlaying() ? '⏸' : '▶'}
        </button>
        <div class="timeline-label">SONG</div>

        {/* Loop-mode switch — toggle between full song and pattern-only loop.
            In 'pattern' mode the song timeline dims and the editing record loops. */}
        <div class="loop-switch" role="group" aria-label="Playback mode">
          <button
            class="loop-switch-opt"
            classList={{ active: playbackMode() === 'song' }}
            onClick={() => setPlaybackMode('song')}
            title="Play through the song timeline"
          >
            🎵 SONG
          </button>
          <button
            class="loop-switch-opt"
            classList={{ active: playbackMode() === 'pattern' }}
            onClick={() => setPlaybackMode('pattern')}
            title="Loop the editing pattern only — for composing"
          >
            🔁 LOOP
          </button>
        </div>

        <div class="timeline-info">
          {song().length} blocks · {song().reduce((sum, s) => sum + s.bars, 0)} bars
        </div>
      </div>

      <div class="timeline-strip">
        <For each={song()}>
          {(slot, i) => (
            <Vinyl
              index={i()}
              patternId={slot.patternId}
              bars={slot.bars}
              isPlaying={
                isPlaying() && (
                  playbackMode() === 'pattern'
                    ? slot.patternId === editingPatternId()
                    : playingSlotIndex() === i()
                )
              }
              editable={props.editable ?? false}
            />
          )}
        </For>
        {/* '+' record — opens Studio with an empty pattern ready to fill */}
        <button
          class="vinyl vinyl-add"
          onClick={createNewRecord}
          title="Create your own record — opens Studio with a fresh empty pattern"
        >
          <div class="vinyl-grooves" />
          <div class="vinyl-label vinyl-label-add">
            <span class="vinyl-plus">+</span>
            <span class="vinyl-add-name">NEW</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function Vinyl(props: {
  index: number;
  patternId: PatternId;
  bars: number;
  isPlaying: boolean;
  editable: boolean;
}) {
  const [menuOpen, setMenuOpen] = createSignal(false);
  const color = () => PATTERN_COLORS[props.patternId];
  const name = () => patternBank()[props.patternId]?.name ?? props.patternId;

  function onClick() {
    jumpToSongSlot(props.index);
    if (props.editable) selectPattern(props.patternId);
  }

  function cyclePattern(e: MouseEvent) {
    e.stopPropagation();
    const idx = PATTERN_IDS.indexOf(props.patternId);
    const next = PATTERN_IDS[(idx + 1) % PATTERN_IDS.length];
    setSlotPattern(props.index, next);
  }

  function onRightClick(e: MouseEvent) {
    e.preventDefault();
    setMenuOpen((v) => !v);
  }

  return (
    <div
      class="vinyl"
      classList={{ playing: props.isPlaying }}
      style={{ '--vinyl-color': color() }}
      onClick={onClick}
      onContextMenu={onRightClick}
      title={`${name()} × ${props.bars} bars`}
    >
      {/* The spinning vinyl group — black grooved disc + coloured center label */}
      <div class="vinyl-spinner">
        <div class="vinyl-grooves" />
        <div class="vinyl-label">
          <span class="vinyl-id">{props.patternId}</span>
          <span class="vinyl-bars">×{props.bars}</span>
        </div>
      </div>

      {/* Pattern name beneath — does NOT rotate so it stays readable */}
      <span class="vinyl-name">{name()}</span>

      <Show when={props.editable}>
        <div class="vinyl-actions" onClick={(e) => e.stopPropagation()}>
          <button title="Cycle pattern" onClick={cyclePattern}>↻</button>
          <button title="More bars" onClick={() => setSlotBars(props.index, props.bars + 1)}>+</button>
          <button title="Fewer bars" onClick={() => setSlotBars(props.index, props.bars - 1)}>−</button>
          <button title="Remove" class="rm" onClick={() => removeSongSlot(props.index)}>×</button>
        </div>
      </Show>

      <Show when={menuOpen()}>
        <div class="vinyl-menu" onClick={(e) => e.stopPropagation()}>
          <For each={PATTERN_IDS}>
            {(id) => (
              <button
                style={{ '--menu-color': PATTERN_COLORS[id] }}
                classList={{ active: id === props.patternId }}
                onClick={() => { setSlotPattern(props.index, id); setMenuOpen(false); }}
              >
                {id}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
