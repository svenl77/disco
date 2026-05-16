/**
 * Pattern Bank — A..H buttons for selecting which pattern is in the editor.
 * Active pattern (editable) has a glow ring; the currently playing pattern
 * gets a small running indicator.
 *
 * Double-click to rename a slot inline.
 */
import { For, createSignal } from 'solid-js';
import { editingPatternId, playingPatternId, selectPattern, patternBank, renamePattern } from '../state';
import { PATTERN_COLORS, PATTERN_IDS, type PatternId } from '../audio/song';

export function PatternBank() {
  return (
    <div class="pattern-bank">
      <For each={PATTERN_IDS}>{(id) => <BankSlot id={id} />}</For>
    </div>
  );
}

function BankSlot(props: { id: PatternId }) {
  const [editing, setEditing] = createSignal(false);
  let inputEl: HTMLInputElement | undefined;
  const name = () => patternBank()[props.id]?.name ?? '';
  const isEditing = () => editingPatternId() === props.id;
  const isPlaying = () => playingPatternId() === props.id;

  function commit() {
    if (!inputEl) return;
    renamePattern(props.id, inputEl.value.toUpperCase().slice(0, 8) || props.id);
    setEditing(false);
  }

  return (
    <button
      class="bank-slot"
      classList={{ editing: isEditing(), playing: isPlaying() }}
      style={{ '--slot-color': PATTERN_COLORS[props.id] }}
      onClick={() => !editing() && selectPattern(props.id)}
      onDblClick={() => {
        setEditing(true);
        queueMicrotask(() => inputEl?.focus());
      }}
    >
      <span class="bank-slot-id">{props.id}</span>
      {editing() ? (
        <input
          ref={(el) => (inputEl = el)}
          value={name()}
          maxLength={8}
          onClick={(e) => e.stopPropagation()}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          class="bank-slot-input"
        />
      ) : (
        <span class="bank-slot-name">{name()}</span>
      )}
    </button>
  );
}
