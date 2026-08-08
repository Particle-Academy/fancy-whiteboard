import type { LiveContract } from "@particle-academy/fancy-query";
import type { ItemId } from "./types";

/**
 * The whiteboard Live Contract.
 *
 * Pure data, with `LiveContract` imported as a TYPE, so this adds no dependency
 * — a host that does not want live behaviour pays nothing for the declaration.
 *
 * Unlike the catalog, this package has **no backend twin**: the board's storage
 * is the host's. So the contract is a statement of what a host should broadcast
 * to make a shared board converge, rather than a mirror of events we emit. Emit
 * these names and the wiring is free.
 *
 * ## What is deliberately NOT here
 *
 * **Cursors and presence.** They are the highest-frequency events on a
 * collaborative surface — one per mouse move, per participant — and they carry
 * their own payload. Putting them in the contract would invalidate a query on
 * every pointer movement, so a board with three people on it would re-fetch its
 * items hundreds of times a minute and still show nothing new.
 *
 * Presence is a **stream**, not a cache: render it from the transport directly
 * (`<CursorLayer cursors={...}>`), and let the contract cover only the durable
 * document. That distinction is the whole difference between this shape and the
 * server-owned-records shape, and it is the one an author gets wrong first.
 *
 * **In-progress strokes.** A pen stroke streams point by point while it is
 * being drawn; only its completion changes the stored document. `Drawing`
 * already exposes `onStrokePoint` for the live half.
 */
export const whiteboardLive = {
    namespace: "whiteboard",
    events: [
        { event: "whiteboard.board.updated", keys: [["whiteboard", "boards"]] },
        { event: "whiteboard.board.deleted", keys: [["whiteboard", "boards"]] },

        // Items are the document. A create/delete changes the collection; a
        // move changes geometry the collection query already carries, so all
        // three land on the same key.
        { event: "whiteboard.item.created", keys: [["whiteboard", "items"]] },
        { event: "whiteboard.item.updated", keys: [["whiteboard", "items"]] },
        { event: "whiteboard.item.deleted", keys: [["whiteboard", "items"]] },
        { event: "whiteboard.item.moved", keys: [["whiteboard", "items"]] },

        // A completed stroke only — see the note above about in-progress points.
        { event: "whiteboard.stroke.created", keys: [["whiteboard", "strokes"]] },
        { event: "whiteboard.stroke.deleted", keys: [["whiteboard", "strokes"]] },
    ],
} as const satisfies LiveContract;

/**
 * Per-board keys, for a host that shows more than one board.
 *
 * The contract can only declare PREFIXES, because it is static data and a board
 * id is not known until runtime. TanStack matches by prefix, so the contract's
 * `["whiteboard", "items"]` invalidates every board's items — correct, and
 * broader than a multi-board app wants.
 *
 * Query with these and the same invalidation still reaches them, because
 * `["whiteboard", "items"]` is a prefix of `["whiteboard", "items", boardId]`.
 * You get narrower cache entries and the contract keeps working unchanged.
 */
export const whiteboardKeys = {
    board: (boardId: ItemId) => ["whiteboard", "boards", boardId] as const,
    items: (boardId: ItemId) => ["whiteboard", "items", boardId] as const,
    strokes: (boardId: ItemId) => ["whiteboard", "strokes", boardId] as const,
} as const;
