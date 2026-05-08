export type Point = { x: number; y: number };

export type Viewport = { x: number; y: number; zoom: number };

export type ItemId = string;

export type BoardItemBase = {
  id: ItemId;
  x: number;
  y: number;
  z?: number;
};

export type StickyNoteItem = BoardItemBase & {
  kind: "sticky";
  width: number;
  height: number;
  text: string;
  color?: string;
  authorId?: string;
};

export type ShapeKind =
  | "rect"
  | "rounded-rect"
  | "ellipse"
  | "diamond"
  | "triangle"
  | "line"
  | "arrow"
  | "text";

export const SHAPE_KINDS: ShapeKind[] = [
  "rect",
  "rounded-rect",
  "ellipse",
  "diamond",
  "triangle",
  "line",
  "arrow",
  "text",
];

export type ShapeItem = BoardItemBase & {
  kind: "shape";
  shape: ShapeKind;
  width: number;
  height: number;
  text?: string;
  fill?: string;
  stroke?: string;
  /** For line / arrow: flip the diagonal so the shape reflects the drag direction. */
  flipX?: boolean;
  flipY?: boolean;
};

export type Stroke = {
  id: string;
  points: Point[];
  color?: string;
  size?: number;
  authorId?: string;
};

export type ConnectorItem = {
  id: ItemId;
  kind: "connector";
  from: ItemId | Point;
  to: ItemId | Point;
  color?: string;
};

export type BoardItem = StickyNoteItem | ShapeItem | ConnectorItem;

export type RemoteCursor = {
  userId: string;
  name?: string;
  color?: string;
  x: number;
  y: number;
};
