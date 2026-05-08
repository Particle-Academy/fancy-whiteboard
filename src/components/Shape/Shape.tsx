import type { CSSProperties } from "react";
import type { ShapeItem } from "../../types";

export type ShapeProps = {
  item: ShapeItem;
  onChange?: (next: ShapeItem) => void;
  onSelect?: (id: string) => void;
  selected?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Shape — rect / ellipse / text primitive. Drag-to-move; resize/edit owned by host.
 */
export function Shape({ item, onChange, onSelect, selected, readOnly, className, style }: ShapeProps) {
  const onPointerDown = (e: React.PointerEvent) => {
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
  };

  const baseStyle: CSSProperties = {
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    zIndex: item.z,
    ...style,
  };

  if (item.shape === "text") {
    return (
      <div
        className={["fw-item fw-shape fw-shape--text", selected ? "fw-shape--selected" : "", className ?? ""].filter(Boolean).join(" ")}
        style={baseStyle}
        onPointerDown={onPointerDown}
      >
        {item.text ?? ""}
      </div>
    );
  }

  return (
    <svg
      className={["fw-item fw-shape", selected ? "fw-shape--selected" : "", className ?? ""].filter(Boolean).join(" ")}
      style={baseStyle}
      width={item.width}
      height={item.height}
      onPointerDown={onPointerDown}
    >
      {item.shape === "rect" && (
        <rect x={1} y={1} width={item.width - 2} height={item.height - 2} fill={item.fill ?? "transparent"} stroke={item.stroke ?? "#334155"} strokeWidth={2} rx={4} />
      )}
      {item.shape === "ellipse" && (
        <ellipse cx={item.width / 2} cy={item.height / 2} rx={item.width / 2 - 1} ry={item.height / 2 - 1} fill={item.fill ?? "transparent"} stroke={item.stroke ?? "#334155"} strokeWidth={2} />
      )}
    </svg>
  );
}
