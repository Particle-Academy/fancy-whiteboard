# Changelog

Notable changes to `@particle-academy/fancy-whiteboard`.

**BREAKING** marks anything that can stop working on upgrade. This package is
pre-1.0, so breaking changes land in MINOR releases — read those entries before
upgrading.

> Entries below **1.0** were reconstructed from git history when this file was
> introduced, so they summarise commit subjects rather than consumer impact.
> Everything from the next release onward is written by hand, in the same commit
> as the change.

---

## [Unreleased]

## 0.5.0 — 2026-08-20

### Fixed

- **`Drawing` now fills its container instead of pinning itself to 300x150.**

  It could never bootstrap. `measured` starts at `{ w: 0, h: 0 }`, so it rendered
  `width={w || undefined}` — no width attribute — so the `<svg>` fell back to the
  browser's default intrinsic size of **300x150**, so the ResizeObserver
  measured *that* and wrote it back as the real size. **It was measuring itself
  before anything had given it a size**, and then observing the element it had
  just frozen.

  The result: a pen surface stuck at 300px wide however much room it was given.
  Seen on the docs site at 300px inside a 1246px container — in a component whose
  own documentation says it "auto-measures its rendered size via ResizeObserver".

  The fix lets CSS size it (`100%` of its container when no explicit size is
  given) and measures the result, rather than deriving its layout size from a
  measurement of its own fallback. The `width` / `height` attributes are now set
  only when the caller supplies them.

  **What a consumer must DO:** nothing, unless you were relying on the 300x150 —
  which was the defect, not a default. If you want a fixed size, pass `width` and
  `height`; that opt-out is unchanged and is now also asserted. A `style` you
  pass still wins over the fill, so sizing it yourself keeps working.

  Found while making canvas previews full-width on the docs site: removing the
  card padding revealed that the component had not been filling the space it was
  already being given.


## 0.4.0 — 2026-08-07

### Added

- **`whiteboardLive` — this package's Live Contract**, plus `whiteboardKeys`
  for per-board query keys. Declares which events a host should broadcast to
  make a shared board converge, and which query keys each one invalidates.

  `fancy-query` is a **type-only** import, so this adds no dependency.

  Unlike the catalog contract this has no backend twin — the board's storage is
  the host's — so it is a statement of what to emit rather than a mirror of what
  we emit. Emit these names and the wiring is free.

  **Cursors and presence are deliberately NOT in it.** They fire once per mouse
  move, per participant. In a contract, a board with three people on it would
  re-fetch its items hundreds of times a minute and still show nothing new.
  Presence is a stream — render it from the transport (`<CursorLayer>`) and let
  the contract cover only the durable document. Same reason in-progress stroke
  points are absent while completed strokes are present.

  **What you must do:** nothing. Additive.


## 0.3.0 — 2026-08-07

### Changed

- **BREAKING — Node 22 is no longer supported.** `engines.node` moves from `>=22` to `>=22`.

  **What you must do:** on Node 22 or newer, nothing. Note npm only *warns* on an `engines` mismatch while **pnpm fails the install**, so this surfaces differently depending on your package manager. Node 18 is end-of-life and 20 is maintenance-only.

- **BREAKING — React 18 is no longer supported.** `peerDependencies.react` / `react-dom` are now `^19.0.0`.

  **What you must do:** on React 19, nothing. On React 18, stay on the previous release, or upgrade your app to 19 first.

  React 18 support was a claim nothing tested — every build and test in this package ran against 19, so the 18 half of the old range was never executed. An untested compatibility claim is worse than an absent one, because it reads as support.

### Why

These are the kit 0.5 platform floors, applied across every package at once so a consumer never has to resolve a mix. **No API changed, nothing was removed, nothing was renamed** — only what the package requires.


## 0.2.1 — 2026-06-02

- Maintenance only (1 internal commit).

## 0.2.0 — 2026-05-29

### Added

- adopt shared react-fancy StickyNote primitive (BREAKING)

## 0.1.9 — 2026-05-09

### Fixed

- drop always-truthy onChange check in click-to-edit branch (TS2774)

## 0.1.8 — 2026-05-09

### Added

- tweened motion + dark-class theming + cursor transitions

## 0.1.5 — 2026-05-08

### Fixed

- **Shape:** line and arrow honor drag direction via flipX/flipY

## 0.1.4 — 2026-05-08

### Added

- **Shape:** full basic kit — rect, rounded-rect, ellipse, diamond, triangle, line, arrow

## 0.1.3 — 2026-05-08

### Added

- click-to-edit sticky notes; auto-measure Drawing layer

## 0.1.2 — 2026-05-08

### Added

- **StickyNote:** drag from anywhere, double-click to edit, resize handle; fix(Drawing): transparent hit-target

## 0.1.1 — 2026-05-08

### Fixed

- sticky note styling and switch publish to OIDC

## 0.1.0 — 2026-05-08

### Added

- initial scaffold (Board, StickyNote, Drawing, Connector, Shape, Cursor)
