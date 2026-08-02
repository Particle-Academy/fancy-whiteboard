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
