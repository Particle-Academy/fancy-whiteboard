import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import type { Viewport } from "../../types";

export type BoardProps = {
  viewport?: Viewport;
  defaultViewport?: Viewport;
  onViewportChange?: (v: Viewport) => void;
  minZoom?: number;
  maxZoom?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

/**
 * Board — pan/zoom viewport that hosts whiteboard items.
 * Controlled (pass `viewport` + `onViewportChange`) or uncontrolled (`defaultViewport`).
 */
export function Board({
  viewport: controlled,
  defaultViewport = DEFAULT_VIEWPORT,
  onViewportChange,
  minZoom = 0.1,
  maxZoom = 4,
  className,
  style,
  children,
}: BoardProps) {
  const [internal, setInternal] = useState<Viewport>(defaultViewport);
  const v = controlled ?? internal;
  const ref = useRef<HTMLDivElement>(null);

  const update = useCallback(
    (next: Viewport) => {
      if (controlled === undefined) setInternal(next);
      onViewportChange?.(next);
    },
    [controlled, onViewportChange],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.001);
      const nextZoom = Math.min(maxZoom, Math.max(minZoom, v.zoom * factor));
      const k = nextZoom / v.zoom;
      update({ x: px - (px - v.x) * k, y: py - (py - v.y) * k, zoom: nextZoom });
    },
    [v, update, minZoom, maxZoom],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 1 && !(e.button === 0 && e.altKey)) return;
      e.preventDefault();
      const start = { x: e.clientX, y: e.clientY };
      const startV = v;
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent) => {
        update({ x: startV.x + ev.clientX - start.x, y: startV.y + ev.clientY - start.y, zoom: startV.zoom });
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [v, update],
  );

  return (
    <div
      ref={ref}
      className={className ? `fw-board ${className}` : "fw-board"}
      style={style}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
    >
      <div
        className="fw-board__viewport"
        style={{ transform: `translate(${v.x}px, ${v.y}px) scale(${v.zoom})` }}
      >
        {children}
      </div>
    </div>
  );
}
