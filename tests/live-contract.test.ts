import { describe, expect, it } from "vitest";
import { toEchoMap, validateLiveContract } from "@particle-academy/fancy-query";
import { whiteboardKeys, whiteboardLive } from "../src/live";

describe("whiteboard Live Contract", () => {
    it("is well-formed", () => {
        expect(validateLiveContract(whiteboardLive)).toEqual([]);
    });

    it("declares every event under its own namespace", () => {
        for (const { event } of whiteboardLive.events) {
            expect(event.startsWith("whiteboard."), `${event} is not in the whiteboard namespace`).toBe(true);
        }
    });

    it("carries NO cursor or presence event", () => {
        // The defining constraint of the collaborative-document shape, and the
        // mistake an author makes first. Cursor events fire once per mouse
        // move, per participant. In the contract, a board with three people on
        // it would re-fetch its items hundreds of times a minute and still show
        // nothing new — presence is a stream, not a cache.
        const names = whiteboardLive.events.map((e) => e.event).join(" ");

        expect(names).not.toContain("cursor");
        expect(names).not.toContain("presence");
        expect(names).not.toContain("pointer");
    });

    it("carries no in-progress stroke event", () => {
        // A stroke streams point by point while it is drawn; only completion
        // changes the stored document. `Drawing.onStrokePoint` is the live half.
        const names = whiteboardLive.events.map((e) => e.event);

        expect(names).toContain("whiteboard.stroke.created");
        expect(names.join(" ")).not.toContain("stroke.point");
        expect(names.join(" ")).not.toContain("stroke.progress");
    });

    it("maps to an echo map a host can hand straight to the invalidation hook", () => {
        const map = toEchoMap(whiteboardLive);

        expect(map["whiteboard.item.moved"]).toEqual([["whiteboard", "items"]]);
        expect(Object.keys(map)).toHaveLength(whiteboardLive.events.length);
    });
});

describe("whiteboardKeys", () => {
    it("builds per-board keys under the contract's own prefixes", () => {
        expect(whiteboardKeys.items("b1")).toEqual(["whiteboard", "items", "b1"]);
        expect(whiteboardKeys.strokes("b1")).toEqual(["whiteboard", "strokes", "b1"]);
        expect(whiteboardKeys.board("b1")).toEqual(["whiteboard", "boards", "b1"]);
    });

    it("stays reachable by the contract's broader invalidation", () => {
        // The property that lets a static contract work with runtime ids:
        // TanStack matches by PREFIX, so the contract's ["whiteboard","items"]
        // still invalidates ["whiteboard","items",boardId]. If these two ever
        // disagreed on the prefix, a host would query one key and invalidate
        // another — and see a board that never updates.
        const contractKeys = whiteboardLive.events.flatMap((e) => e.keys.map((k) => [...k]));

        for (const scoped of [whiteboardKeys.board("b1"), whiteboardKeys.items("b1"), whiteboardKeys.strokes("b1")]) {
            const prefix = scoped.slice(0, 2);
            expect(
                contractKeys.some((k) => k.length === 2 && k[0] === prefix[0] && k[1] === prefix[1]),
                `no contract event invalidates ${JSON.stringify(prefix)}`,
            ).toBe(true);
        }
    });
});
