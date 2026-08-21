/**
 * `Drawing` must fill the box it is given.
 *
 * It did not, and the reason is a bootstrapping deadlock the component could
 * never escape:
 *
 *   1. `measured` starts `{ w: 0, h: 0 }`.
 *   2. It renders `width={w || undefined}`, so with `w === 0` the `<svg>` gets
 *      NO width attribute.
 *   3. An `<svg>` with no width and no CSS size falls back to the browser's
 *      default intrinsic size — **300 x 150**.
 *   4. The effect measures the SVG's own `getBoundingClientRect()`, which is
 *      therefore 300 x 150 — the default, not the container.
 *   5. It writes `width="300" height="150"`, and the ResizeObserver goes on
 *      observing that same, now permanently fixed, element.
 *
 * **It measures itself, and it has no size to measure until something gives it
 * one** — so it latches onto 300 x 150 and stays there. Observed on the docs
 * site: a 300px pen surface inside a 1246px container, in a component whose own
 * documentation says it "auto-measures its rendered size via ResizeObserver".
 *
 * The fix is to let CSS size it (`100%` of its container) and measure the result,
 * rather than deriving its layout size from a measurement of its own default.
 *
 * jsdom reports every rect as zero, so these assert the STRUCTURE that breaks
 * the cycle rather than a pixel width — a jsdom test asserting `width === 1246`
 * would be asserting the mock, not the fix.
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { Drawing } from "../src/components/Drawing/Drawing";

const render = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(<Drawing strokes={[]} {...props} />);

describe("Drawing sizing", () => {
  it("does not pin itself to the SVG default when no size is given", () => {
    const html = render();

    // 300x150 is the browser's default intrinsic SVG size. If it appears here,
    // the component has measured its own fallback and frozen at it.
    expect(html).not.toContain('width="300"');
    expect(html).not.toContain('height="150"');
  });

  it("fills its container by CSS, which is what breaks the cycle", () => {
    const html = render();

    expect(html).toMatch(/width:\s*100%/);
    expect(html).toMatch(/height:\s*100%/);
  });

  it("still honours an explicit size, because that is the opt-out", () => {
    const html = render({ width: 640, height: 480 });

    expect(html).toContain('width="640"');
    expect(html).toContain('height="480"');
    // An explicit size must not also be stretched to 100%, or the opt-out does
    // not opt out of anything.
    expect(html).not.toMatch(/width:\s*100%/);
  });

  it("lets a caller's own style win over the fill default", () => {
    // The defaults are a floor, not a cage: a consumer sizing it themselves
    // through `style` must not be overridden by us.
    const html = render({ style: { width: "12rem" } });

    expect(html).toContain("width:12rem");
  });
});
