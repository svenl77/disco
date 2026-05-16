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
  addSongSlot,
  removeSongSlot,
  editingPatternId,
  selectPattern,
  isPlaying,
  togglePlay,
} from '../state';
import { PATTERN_COLORS, PATTERN_IDS, type PatternId } from '../audio/song';

interface Props {
  /** Show inline editing controls (bars +/-, pattern picker, remove). */
  editable?: boolean;
}

export function TimelineView(props: Props) {
  return (
    <div class="timeline-wrap">
      <div class="timeline-head">
        <button class="timeline-play" classList={{ playing: isPlaying() }} onClick={togglePlay}>
          {isPlaying() ? '⏸' : '▶'}
        </button>
        <div class="timeline-label">SONG</div>
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
              isPlaying={playingSlotIndex() === i() && isPlaying()}
              editable={props.editable ?? false}
            />
          )}
        </For>
        {/* '+' record — creates a new slot using the currently-edited pattern */}
        <button
          class="vinyl vinyl-add"
          onClick={() => addSongSlot(editingPatternId(), 4)}
          title="Add a new record to the song"
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
