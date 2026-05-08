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

const DEFAULT_FILL = "rgba(248, 250, 252, 0.85)";
const DEFAULT_STROKE = "#334155";
const DEFAULT_STROKE_W = 2;

/**
 * Shape — basic whiteboard primitives. All shapes share a bounding-box model
 * (x, y, width, height); the `shape` discriminator picks the renderer.
 *
 * Supported kinds: rect, rounded-rect, ellipse, diamond, triangle, line,
 * arrow, text. Drag-to-move is built in.
 */
export function Shape({
  item,
  onChange,
  onSelect,
  selected,
  readOnly,
  className,
  style,
}: ShapeProps) {
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

  const cls = [
    "fw-item fw-shape",
    selected ? "fw-shape--selected" : "",
    className ?? "",
  ].filter(Boolean).join(" ");

  if (item.shape === "text") {
    return (
      <div
        className={`${cls} fw-shape--text`}
        style={baseStyle}
        onPointerDown={onPointerDown}
      >
        {item.text ?? ""}
      </div>
    );
  }

  return (
    <svg
      className={cls}
      style={{ ...baseStyle, overflow: "visible" }}
      width={item.width}
      height={item.height}
      onPointerDown={onPointerDown}
    >
      <ShapeGeometry item={item} />
      {item.text && item.shape !== "line" && item.shape !== "arrow" && (
        <text
          x={item.width / 2}
          y={item.height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize={14}
          fill="#1f2937"
          style={{ pointerEvents: "none" }}
        >
          {item.text}
        </text>
      )}
    </svg>
  );
}

/**
 * Compute the from/to local-coord endpoints for line and arrow shapes,
 * honoring `flipX`/`flipY` so the shape preserves the drag direction
 * the user actually drew.
 */
function lineEndpoints(item: ShapeItem): [{ x: number; y: number }, { x: number; y: number }] {
  const { width: w, height: h, flipX, flipY } = item;
  const fromX = flipX ? w : 0;
  const fromY = flipY ? h : 0;
  const toX = flipX ? 0 : w;
  const toY = flipY ? 0 : h;
  return [{ x: fromX, y: fromY }, { x: toX, y: toY }];
}

function ShapeGeometry({ item }: { item: ShapeItem }) {
  const { width: w, height: h } = item;
  const fill = item.fill ?? DEFAULT_FILL;
  const stroke = item.stroke ?? DEFAULT_STROKE;
  const sw = DEFAULT_STROKE_W;
  const inset = sw / 2 + 0.5;

  switch (item.shape) {
    case "rect":
      return (
        <rect
          x={inset}
          y={inset}
          width={Math.max(0, w - inset * 2)}
          height={Math.max(0, h - inset * 2)}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      );
    case "rounded-rect":
      return (
        <rect
          x={inset}
          y={inset}
          width={Math.max(0, w - inset * 2)}
          height={Math.max(0, h - inset * 2)}
          rx={Math.min(16, Math.min(w, h) / 4)}
          ry={Math.min(16, Math.min(w, h) / 4)}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      );
    case "ellipse":
      return (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={Math.max(0, w / 2 - inset)}
          ry={Math.max(0, h / 2 - inset)}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
        />
      );
    case "diamond": {
      const pts = `${w / 2},${inset} ${w - inset},${h / 2} ${w / 2},${h - inset} ${inset},${h / 2}`;
      return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />;
    }
    case "triangle": {
      const pts = `${w / 2},${inset} ${w - inset},${h - inset} ${inset},${h - inset}`;
      return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />;
    }
    case "line": {
      const [from, to] = lineEndpoints(item);
      return (
        <line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      );
    }
    case "arrow": {
      const [from, to] = lineEndpoints(item);
      const headSize = Math.max(8, sw * 5);
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const baseX = to.x - ux * headSize;
      const baseY = to.y - uy * headSize;
      const perpX = -uy;
      const perpY = ux;
      const leftX = baseX + perpX * headSize * 0.5;
      const leftY = baseY + perpY * headSize * 0.5;
      const rightX = baseX - perpX * headSize * 0.5;
      const rightY = baseY - perpY * headSize * 0.5;
      return (
        <g>
          <line x1={from.x} y1={from.y} x2={baseX} y2={baseY} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <polygon points={`${to.x},${to.y} ${leftX},${leftY} ${rightX},${rightY}`} fill={stroke} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        </g>
      );
    }
    default:
      return null;
  }
}
