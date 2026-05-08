import { type CSSProperties, useCallback, useRef, useState } from "react";
import type { Point, Stroke } from "../../types";

export type DrawingProps = {
  strokes: Stroke[];
  onStrokeStart?: (stroke: Stroke) => void;
  onStrokePoint?: (id: string, point: Point) => void;
  onStrokeEnd?: (stroke: Stroke) => void;
  color?: string;
  size?: number;
  width: number;
  height: number;
  enabled?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Drawing — freeform pen layer. Controlled: parent owns `strokes`.
 * Streams new strokes via the callbacks so apps can broadcast them as they form.
 */
export function Drawing({
  strokes,
  onStrokeStart,
  onStrokePoint,
  onStrokeEnd,
  color = "#111827",
  size = 2,
  width,
  height,
  enabled = true,
  className,
  style,
}: DrawingProps) {
  const [active, setActive] = useState<Stroke | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  const localPoint = useCallback((e: React.PointerEvent | PointerEvent): Point => {
    const rect = ref.current?.getBoundingClientRect();
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.button !== 0) return;
      e.preventDefault();
      const id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const stroke: Stroke = { id, points: [localPoint(e)], color, size };
      setActive(stroke);
      onStrokeStart?.(stroke);
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent) => {
        const p = localPoint(ev);
        setActive((prev) => (prev ? { ...prev, points: [...prev.points, p] } : prev));
        onStrokePoint?.(id, p);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setActive((prev) => {
          if (prev) onStrokeEnd?.(prev);
          return null;
        });
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [enabled, color, size, localPoint, onStrokeStart, onStrokePoint, onStrokeEnd],
  );

  const all = active ? [...strokes, active] : strokes;

  return (
    <svg
      ref={ref}
      className={className}
      style={{ pointerEvents: enabled ? "auto" : "none", ...style }}
      width={width}
      height={height}
      onPointerDown={onPointerDown}
    >
      {all.map((s) => (
        <path
          key={s.id}
          d={toPath(s.points)}
          fill="none"
          stroke={s.color ?? "#111827"}
          strokeWidth={s.size ?? 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

function toPath(points: Point[]): string {
  if (!points.length) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}
