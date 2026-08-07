// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Drawing } from "../src/components/Drawing";
import { StickyNote } from "../src/components/StickyNote";
import { Shape } from "../src/components/Shape";
import { CursorLayer } from "../src/components/Cursor";
import { SHAPE_KINDS, type ShapeItem, type StickyNoteItem, type Stroke } from "../src/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// ResizeObserver is not implemented in jsdom, and Drawing auto-measures itself
// with one whenever width/height are not both supplied.
class NoopResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
}
(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= NoopResizeObserver;

const roots: Root[] = [];

function mount(el: ReactElement): HTMLElement {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    roots.push(root);
    act(() => root.render(el));
    return host;
}

afterEach(() => {
    act(() => roots.splice(0).forEach((r) => r.unmount()));
    document.body.innerHTML = "";
});

const stroke = (over: Partial<Stroke> = {}): Stroke => ({ id: "s1", points: [], ...over });

const note = (over: Partial<StickyNoteItem> = {}): StickyNoteItem => ({
    id: "n1", kind: "sticky", x: 10, y: 20, width: 160, height: 120, text: "hello", ...over,
});

const shape = (over: Partial<ShapeItem> = {}): ShapeItem => ({
    id: "sh1", kind: "shape", shape: "rect", x: 0, y: 0, width: 100, height: 60, ...over,
});

describe("Drawing", () => {
    it("renders a stroke as an SVG path in move-to / line-to order", () => {
        const host = mount(
            <Drawing width={100} height={100} strokes={[stroke({ points: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }] })]} />,
        );

        const d = host.querySelector("path")!.getAttribute("d");
        expect(d).toBe("M1,2 L3,4 L5,6");
    });

    it("renders an empty path rather than a broken one for a stroke with no points", () => {
        // A stroke can exist before its first point arrives when strokes are
        // streamed in from another user. `M` with nothing after it is invalid.
        const host = mount(<Drawing width={100} height={100} strokes={[stroke({ points: [] })]} />);

        expect(host.querySelector("path")!.getAttribute("d")).toBe("");
    });

    it("draws every stroke it is given", () => {
        const host = mount(
            <Drawing
                width={100}
                height={100}
                strokes={[
                    stroke({ id: "a", points: [{ x: 0, y: 0 }] }),
                    stroke({ id: "b", points: [{ x: 1, y: 1 }] }),
                ]}
            />,
        );

        expect(host.querySelectorAll("path")).toHaveLength(2);
    });
});

describe("StickyNote", () => {
    it("renders the item's text and position", () => {
        const host = mount(<StickyNote item={note({ text: "ship it" })} />);

        expect(host.textContent).toContain("ship it");
    });

    it("reports selection by id on primary pointer down", () => {
        const onSelect = vi.fn();
        // `onChange` is required: the handler early-returns without it, because
        // selection shares the entry point with dragging. A read-only note is
        // therefore not selectable — worth knowing, since passing only
        // `onSelect` looks like it should work and silently does nothing.
        const host = mount(<StickyNote item={note()} onChange={() => {}} onSelect={onSelect} />);
        const el = host.querySelector<HTMLElement>(".fw-sticky")!;
        el.setPointerCapture = () => {};

        act(() => {
            el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
        });

        expect(onSelect).toHaveBeenCalledWith("n1");
    });

    it("ignores a non-primary button, so a right-click does not select", () => {
        const onSelect = vi.fn();
        const host = mount(<StickyNote item={note()} onChange={() => {}} onSelect={onSelect} />);
        const el = host.querySelector<HTMLElement>(".fw-sticky")!;
        el.setPointerCapture = () => {};

        act(() => {
            el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 2 }));
        });

        expect(onSelect).not.toHaveBeenCalled();
    });

    it("does not mutate the item it was handed", () => {
        // The controlled contract: the parent owns the item, so the component
        // must never write through the reference it was given. A mutation here
        // is invisible until two views of the same board disagree.
        const item = note();
        const snapshot = structuredClone(item);
        mount(<StickyNote item={item} onChange={() => {}} />);

        expect(item).toEqual(snapshot);
    });
});

describe("Shape", () => {
    it.each(SHAPE_KINDS)("renders the %s kind without throwing", (kind) => {
        // SHAPE_KINDS is exported, so it is a public promise that every listed
        // kind is renderable. Driving the list itself means adding a kind to the
        // union without handling it fails here rather than in a consumer's app.
        const host = mount(<Shape item={shape({ shape: kind, text: "x" })} />);

        expect(host.firstElementChild).not.toBeNull();
    });
});

describe("CursorLayer", () => {
    it("renders one cursor per remote user", () => {
        const host = mount(
            <CursorLayer
                cursors={[
                    { userId: "u1", name: "Ada", x: 10, y: 10 },
                    { userId: "u2", name: "Alan", x: 20, y: 20 },
                ]}
            />,
        );

        expect(host.textContent).toContain("Ada");
        expect(host.textContent).toContain("Alan");
    });

    it("renders nothing for an empty presence list", () => {
        const host = mount(<CursorLayer cursors={[]} />);

        expect(host.querySelectorAll(".fw-cursor")).toHaveLength(0);
    });
});
