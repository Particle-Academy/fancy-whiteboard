import { type CSSProperties, type ReactNode, useCallback } from "react";
import type { StickyNoteItem } from "../../types";

export type StickyNoteProps = {
  item: StickyNoteItem;
  onChange?: (next: StickyNoteItem) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * StickyNote — draggable, editable note. Controlled via `item` + `onChange`.
 */
export function StickyNote({
  item,
  onChange,
  onSelect,
  selected,
  readOnly,
  className,
  style,
  children,
}: StickyNoteProps) {
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (readOnly || !onChange) return;
      if (e.button !== 0 || e.altKey) return;
      onSelect?.(item.id);
      const start = { x: e.clientX, y: e.clientY };
      const origin = { x: item.x, y: item.y };
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent) => {
        onChange({ ...item, x: origin.x + ev.clientX - start.x, y: origin.y + ev.clientY - start.y });
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [item, onChange, onSelect, readOnly],
  );

  return (
    <div
      className={[
        "fw-item fw-sticky",
        selected ? "fw-sticky--selected" : "",
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
    >
      {children ?? (
        <textarea
          className="fw-sticky__text"
          value={item.text}
          readOnly={readOnly}
          onChange={(e) => onChange?.({ ...item, text: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
