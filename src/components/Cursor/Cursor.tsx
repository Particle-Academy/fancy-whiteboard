import type { CSSProperties } from "react";
import type { RemoteCursor } from "../../types";

export type CursorProps = {
  cursor: RemoteCursor;
  className?: string;
  style?: CSSProperties;
};

/** Cursor — single remote-user pointer + name tag. */
export function Cursor({ cursor, className, style }: CursorProps) {
  const color = cursor.color ?? "#3b82f6";
  return (
    <div
      className={["fw-cursor", className ?? ""].filter(Boolean).join(" ")}
      style={{
        position: "absolute",
        left: cursor.x,
        top: cursor.y,
        pointerEvents: "none",
        transform: "translate(-2px, -2px)",
        ...style,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20">
        <path d="M2 2 L2 16 L6 12 L9 18 L11 17 L8 11 L14 11 Z" fill={color} stroke="white" strokeWidth="1" />
      </svg>
      {cursor.name && (
        <span
          style={{
            position: "absolute",
            left: 16,
            top: 12,
            background: color,
            color: "white",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {cursor.name}
        </span>
      )}
    </div>
  );
}

export type CursorLayerProps = {
  cursors: RemoteCursor[];
  className?: string;
  style?: CSSProperties;
};

/** CursorLayer — convenience wrapper that renders many remote cursors. */
export function CursorLayer({ cursors, className, style }: CursorLayerProps) {
  return (
    <div
      className={["fw-cursor-layer", className ?? ""].filter(Boolean).join(" ")}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}
    >
      {cursors.map((c) => (
        <Cursor key={c.userId} cursor={c} />
      ))}
    </div>
  );
}
