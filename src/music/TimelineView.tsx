/**
 * The Song Timeline — the heart of arrangement mode.
 *
 * Renders the `song` (ordered list of slots) as a horizontal strip of colored
 * blocks. Each block shows its pattern ID + name + bar count. The currently
 * playing slot has a glowing border. A playhead bar fills inside the active
 * slot as bars elapse.
 *
 *   [A:INTRO×4] [B:VERSE×4] [C:CHORUS×4] [D:DROP×4]  [+]
 *
 * Click a slot to jump to it. Click + to add a new slot at the end.
 * Right-click (or hover button) to cycle the pattern in that slot.
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
  /** Compact = shorter blocks, used by the Easy panel.
   *  Editable = show controls (bars +/-, remove, dropdown) used by Studio. */
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
            <TimelineBlock
              index={i()}
              patternId={slot.patternId}
              bars={slot.bars}
              isPlaying={playingSlotIndex() === i() && isPlaying()}
              editable={props.editable ?? false}
            />
          )}
        </For>
        <Show when={props.editable ?? false}>
          <button class="timeline-add" onClick={() => addSongSlot(editingPatternId(), 4)} title="Add block">
            +
          </button>
        </Show>
      </div>
    </div>
  );
}

function TimelineBlock(props: {
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
      class="timeline-block"
      classList={{ playing: props.isPlaying }}
      style={{
        '--block-color': color(),
        width: `${48 + props.bars * 8}px`,
      }}
      onClick={onClick}
      onContextMenu={onRightClick}
    >
      <span class="timeline-block-id">{props.patternId}</span>
      <span class="timeline-block-name">{name()}</span>
      <span class="timeline-block-bars">×{props.bars}</span>

      <Show when={props.editable}>
        <div class="timeline-block-actions" onClick={(e) => e.stopPropagation()}>
          <button title="Cycle pattern" onClick={cyclePattern}>↻</button>
          <button title="More bars" onClick={() => setSlotBars(props.index, props.bars + 1)}>+</button>
          <button title="Fewer bars" onClick={() => setSlotBars(props.index, props.bars - 1)}>−</button>
          <button title="Remove block" class="rm" onClick={() => removeSongSlot(props.index)}>×</button>
        </div>
      </Show>

      <Show when={props.isPlaying}>
        <div class="timeline-block-glow" />
      </Show>

      <Show when={menuOpen()}>
        <div class="timeline-block-menu" onClick={(e) => e.stopPropagation()}>
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
