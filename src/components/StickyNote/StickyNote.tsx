import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import type { StickyNoteItem } from "../../types";

export type StickyNoteProps = {
  item: StickyNoteItem;
  onChange?: (next: StickyNoteItem) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
  readOnly?: boolean;
  /** Smallest size resize will allow (default 80×60). */
  minWidth?: number;
  minHeight?: number;
  className?: string;
  style?: CSSProperties;
  /** When provided, replaces the default editable textarea. */
  children?: ReactNode;
};

/**
 * StickyNote — draggable, editable note.
 *
 * Interactions:
 *   • Drag anywhere on the note to move it.
 *   • Double-click to enter edit mode and type; click outside to exit.
 *   • Drag the bottom-right corner handle to resize.
 *
 * Controlled via `item` + `onChange`.
 */
export function StickyNote({
  item,
  onChange,
  onSelect,
  selected,
  readOnly,
  minWidth = 80,
  minHeight = 60,
  className,
  style,
  children,
}: StickyNoteProps) {
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Exit edit mode when clicking outside (or when deselected by parent).
  useEffect(() => {
    if (!editing) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const ta = textareaRef.current;
      if (ta && !ta.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [editing]);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (readOnly || !onChange || editing) return;
      if (e.button !== 0 || e.altKey) return;
      onSelect?.(item.id);
      const start = { x: e.clientX, y: e.clientY };
      const origin = { x: item.x, y: item.y };
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      let moved = false;
      const move = (ev: PointerEvent) => {
        if (!moved) setDragging(true);
        moved = true;
        onChange({ ...item, x: origin.x + ev.clientX - start.x, y: origin.y + ev.clientY - start.y });
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDragging(false);
        // Click-without-drag → enter edit mode. Much more discoverable than
        // double-click, while still preserving drag-to-move.
        if (!moved && !readOnly && onChange) setEditing(true);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [item, onChange, onSelect, readOnly, editing],
  );

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (readOnly || !onChange) return;
      e.stopPropagation();
      e.preventDefault();
      const start = { x: e.clientX, y: e.clientY };
      const origin = { w: item.width, h: item.height };
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      setResizing(true);
      const move = (ev: PointerEvent) => {
        const w = Math.max(minWidth, origin.w + ev.clientX - start.x);
        const h = Math.max(minHeight, origin.h + ev.clientY - start.y);
        onChange({ ...item, width: w, height: h });
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setResizing(false);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [item, onChange, readOnly, minWidth, minHeight],
  );

  // Double-click also enters edit mode for users who expect that gesture.
  const onDoubleClick = useCallback(() => {
    if (readOnly) return;
    setEditing(true);
  }, [readOnly]);

  return (
    <div
      className={[
        "fw-item fw-sticky",
        dragging ? "fw-item--dragging" : "",
        resizing ? "fw-item--resizing" : "",
        selected ? "fw-sticky--selected" : "",
        editing ? "fw-sticky--editing" : "",
        className ?? "",
      ].filter(Boolean).join(" ")}
      style={{
        left: item.x,
        top: item.y,
        width: item.width,
        height: item.height,
        background: item.color ?? "#fde68a",
        zIndex: item.z,
        ...style,
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
    >
      {children ?? (
        <textarea
          ref={textareaRef}
          className="fw-sticky__text"
          value={item.text}
          readOnly={readOnly || !editing}
          tabIndex={editing ? 0 : -1}
          onChange={(e) => onChange?.({ ...item, text: e.target.value })}
          onPointerDown={(e) => { if (editing) e.stopPropagation(); }}
        />
      )}
      {!readOnly && onChange && (
        <div
          className="fw-sticky__resize"
          onPointerDown={onResizePointerDown}
          aria-label="Resize note"
        />
      )}
    </div>
  );
}
