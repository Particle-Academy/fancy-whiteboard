import type { CSSProperties } from "react";
import type { Point } from "../../types";

export type ConnectorProps = {
  from: Point;
  to: Point;
  color?: string;
  width?: number;
  dashed?: boolean;
  className?: string;
  style?: CSSProperties;
};

/**
 * Connector — single SVG line/edge between two world-space points.
 * Resolution of itemId → point is the host app's job (keeps logic minimal).
 */
export function Connector({
  from,
  to,
  color = "#64748b",
  width = 2,
  dashed = false,
  className,
  style,
}: ConnectorProps) {
  const minX = Math.min(from.x, to.x);
  const minY = Math.min(from.y, to.y);
  const w = Math.abs(to.x - from.x) + width * 4;
  const h = Math.abs(to.y - from.y) + width * 4;
  const pad = width * 2;

  return (
    <svg
      className={className}
      style={{
        position: "absolute",
        left: minX - pad,
        top: minY - pad,
        pointerEvents: "none",
        ...style,
      }}
      width={w}
      height={h}
    >
      <line
        x1={from.x - minX + pad}
        y1={from.y - minY + pad}
        x2={to.x - minX + pad}
        y2={to.y - minY + pad}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? `${width * 3} ${width * 2}` : undefined}
        strokeLinecap="round"
      />
    </svg>
  );
}
