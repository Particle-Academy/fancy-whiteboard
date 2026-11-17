# Contributing to @particle-academy/fancy-whiteboard

Notes for anyone, human or agent, working ON this package's code. How to USE the
package is in [AGENTS.md](./AGENTS.md); what it is, is in [README.md](./README.md).
`CLAUDE.md` is a symlink to this file, so Claude Code reads these notes when it
works in this repo.

## Layout

- `src/components/` — `Board`, `StickyNote`, `Drawing`, `Connector`, `Shape`,
  `Cursor` / `CursorLayer`.
- `src/types/` — the item data model (`sticky`, `shape`, `connector`, plus
  `Stroke` and `RemoteCursor`).
- `src/live.ts` — the whiteboard Live Contract (`whiteboardLive`,
  `whiteboardKeys`). `LiveContract` is imported as a TYPE only, so it adds no
  dependency; keep it that way. Its header explains why cursors and in-progress
  strokes are deliberately not in it.
- `src/styles.css` — shipped as `./styles.css`.
- `tests/` — vitest suites.
- [`docs/architecture.md`](./docs/architecture.md) — design principles
  (transport-agnostic, minimal business logic, layerable, JSON-friendly types),
  the coordinate system and host realtime patterns.

## Build and test

```bash
npm run build   # tsup
npm run lint    # tsc --noEmit && eslint .
npm test        # vitest run
```

`tests/manifest.test.ts` fails if `package.json` lists a runtime dependency the
source never imports at runtime.

## Changelog

Update `CHANGELOG.md` in the same commit as the change.
