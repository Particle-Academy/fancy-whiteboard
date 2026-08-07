// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Board } from "../src/components/Board";
import type { Viewport } from "../src/types";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

const board = (host: HTMLElement) => host.querySelector<HTMLElement>(".fw-board")!;
const layer = (host: HTMLElement) => host.querySelector<HTMLElement>(".fw-board__viewport")!;

/** The transform is the only place the viewport is observable from outside. */
function transformOf(host: HTMLElement): string {
    return layer(host).style.transform;
}

/**
 * Board reads pointer position relative to its own box to anchor zoom, and jsdom
 * reports every element as 0×0. Pinning a rect is what makes the anchor maths
 * testable at all.
 */
function stubRect(el: HTMLElement, left = 0, top = 0, width = 800, height = 600) {
    el.getBoundingClientRect = () =>
        ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
}

function wheel(el: HTMLElement, init: Partial<WheelEventInit> & { ctrlKey?: boolean }) {
    const ev = new WheelEvent("wheel", { bubbles: true, cancelable: true, ...init });
    act(() => { el.dispatchEvent(ev); });
    return ev;
}

describe("Board viewport", () => {
    it("renders the default viewport when uncontrolled", () => {
        const host = mount(<Board defaultViewport={{ x: 10, y: 20, zoom: 2 }} />);

        expect(transformOf(host)).toBe("translate(10px, 20px) scale(2)");
    });

    it("renders the viewport it is given when controlled", () => {
        const host = mount(<Board viewport={{ x: -5, y: 7, zoom: 0.5 }} onViewportChange={() => {}} />);

        expect(transformOf(host)).toBe("translate(-5px, 7px) scale(0.5)");
    });

    it("does not move itself when controlled — the parent owns the value", () => {
        // The contract that makes this component driveable by an agent or a
        // parent store: a controlled Board reports intent and renders only what
        // it is handed back. If it also updated internally, the two copies of
        // the viewport would drift apart on the first rejected change.
        const onViewportChange = vi.fn();
        const host = mount(
            <Board viewport={{ x: 0, y: 0, zoom: 1 }} onViewportChange={onViewportChange} />,
        );
        stubRect(board(host));

        wheel(board(host), { deltaY: -100, ctrlKey: true, clientX: 0, clientY: 0 });

        expect(onViewportChange).toHaveBeenCalledTimes(1);
        expect(transformOf(host)).toBe("translate(0px, 0px) scale(1)");
    });

    it("ignores a plain scroll, so the page still scrolls over a board", () => {
        const onViewportChange = vi.fn();
        const host = mount(<Board onViewportChange={onViewportChange} />);
        stubRect(board(host));

        const ev = wheel(board(host), { deltaY: -100, clientX: 0, clientY: 0 });

        expect(onViewportChange).not.toHaveBeenCalled();
        expect(ev.defaultPrevented).toBe(false);
    });

    it("zooms on ctrl+wheel and clamps to maxZoom", () => {
        const seen: Viewport[] = [];
        const host = mount(
            <Board defaultViewport={{ x: 0, y: 0, zoom: 3 }} maxZoom={4} onViewportChange={(v) => seen.push(v)} />,
        );
        stubRect(board(host));

        // A large negative deltaY is a big zoom-in; the factor would take zoom
        // well past 4 without the clamp.
        wheel(board(host), { deltaY: -5000, ctrlKey: true, clientX: 0, clientY: 0 });

        expect(seen.at(-1)!.zoom).toBe(4);
    });

    it("clamps to minZoom on the way out", () => {
        const seen: Viewport[] = [];
        const host = mount(
            <Board defaultViewport={{ x: 0, y: 0, zoom: 0.2 }} minZoom={0.1} onViewportChange={(v) => seen.push(v)} />,
        );
        stubRect(board(host));

        wheel(board(host), { deltaY: 5000, ctrlKey: true, clientX: 0, clientY: 0 });

        expect(seen.at(-1)!.zoom).toBe(0.1);
    });

    it("keeps the point under the cursor fixed while zooming", () => {
        // The property that makes zoom feel right: whatever board coordinate sits
        // under the pointer before the zoom is still under it afterwards. Without
        // this the canvas slides away from what you are pointing at.
        const seen: Viewport[] = [];
        const host = mount(
            <Board defaultViewport={{ x: 0, y: 0, zoom: 1 }} onViewportChange={(v) => seen.push(v)} />,
        );
        stubRect(board(host));

        const px = 300;
        const py = 200;
        // Board coordinate under the cursor before: (px - x) / zoom.
        const beforeX = (px - 0) / 1;
        const beforeY = (py - 0) / 1;

        wheel(board(host), { deltaY: -200, ctrlKey: true, clientX: px, clientY: py });

        const v = seen.at(-1)!;
        expect(v.zoom).toBeGreaterThan(1);
        expect((px - v.x) / v.zoom).toBeCloseTo(beforeX, 6);
        expect((py - v.y) / v.zoom).toBeCloseTo(beforeY, 6);
    });

    it("takes an extra class without dropping its own", () => {
        const host = mount(<Board className="mine" />);

        expect(board(host).className).toBe("fw-board mine");
    });
});
