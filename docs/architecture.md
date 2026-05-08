# Architecture

## Design principles

1. **Transport-agnostic.** No networking, no CRDT, no realtime baked in. Components are controlled — host app owns state and decides how to sync it.
2. **Minimal business logic.** Drag-to-move is the only built-in interaction. Selection, undo/redo, conflict resolution, persistence, permissions — all the host app's call.
3. **Layerable.** Each component renders absolutely-positioned children inside a `Board` viewport. Apps mix-and-match (a `Drawing` layer over `StickyNote`s, `Connector`s between `Shape`s, etc).
4. **JSON-friendly types.** Items are plain serializable objects (`{ id, kind, x, y, ... }`) so they map cleanly to a wire format.

## Data model

See `src/types/index.ts`. Three top-level item kinds (`sticky`, `shape`, `connector`) plus separate `Stroke` (drawing) and `RemoteCursor` (presence) types.

## Coordinate system

`Board` applies a single `transform: translate(x,y) scale(zoom)` to its viewport. Children position themselves in world space (item `x`/`y` are world-space pixels).

`Drawing` is screen-space by default — for world-space drawing, place `<Drawing>` *inside* `<Board>`.

## Realtime patterns (host app)

Typical wiring with Laravel Reverb / Echo:

```ts
// Local edit → broadcast
const onChange = (next) => {
  setNotes((all) => all.map((x) => x.id === next.id ? next : x));
  channel.whisper("note.changed", next);
};

// Remote edit → state
channel.listenForWhisper("note.changed", (next) => {
  setNotes((all) => all.map((x) => x.id === next.id ? next : x));
});
```

Strokes stream via `onStrokePoint` so remote viewers see drawing in progress, not just the finished path.

Cursors: throttle pointer-move to ~30Hz, broadcast `{ userId, x, y }`, render with `<CursorLayer>`.
