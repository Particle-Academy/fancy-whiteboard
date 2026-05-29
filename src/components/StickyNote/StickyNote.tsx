import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from "react";
import { StickyNote as FancyStickyNote } from "@particle-academy/react-fancy";
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
  /** When provided, replaces the default editable note body. */
  children?: ReactNode;
};

/**
 * StickyNote — draggable, resizable board note.
 *
 * The note's paper look and inline text editing come from react-fancy's shared
 * `<StickyNote>` primitive; this wrapper owns the board concerns: absolute
 * positioning, drag-to-move, corner resize, and selection.
 *
 * Interactions:
 *   • Drag anywhere on the note to move it.
 *   • Click (without dragging) — or double-click — to edit; click outside to commit.
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

  // Deselected by parent → leave edit mode.
  useEffect(() => {
    if (!selected && editing) setEditing(false);
  }, [selected, editing]);

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
        if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 4) return;
        if (!moved) setDragging(true);
        moved = true;
        onChange({ ...item, x: origin.x + ev.clientX - start.x, y: origin.y + ev.clientY - start.y });
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setDragging(false);
        // Click without drag → enter edit mode (more discoverable than double-click).
        if (!moved && !readOnly) setEditing(true);
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

  return (
    <div
      className={[
        "fw-item fw-sticky",
        dragging ? "fw-item--dragging" : "",
        resizing ? "fw-item--resizing" : "",
        selected ? "fw-sticky--selected" : "",
        editing ? "fw-sticky--editing" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ left: item.x, top: item.y, width: item.width, height: item.height, zIndex: item.z, ...style }}
      onPointerDown={onPointerDown}
      onDoubleClick={() => {
        if (!readOnly) setEditing(true);
      }}
    >
      <FancyStickyNote
        className="h-full w-full"
        color={item.color ?? "yellow"}
        value={item.text}
        editable={!readOnly && editing}
        autoFocus
        onChange={(text) => onChange?.({ ...item, text })}
      >
        {children}
      </FancyStickyNote>
      {!readOnly && onChange && (
        <div className="fw-sticky__resize" onPointerDown={onResizePointerDown} aria-label="Resize note" />
      )}
    </div>
  );
}
