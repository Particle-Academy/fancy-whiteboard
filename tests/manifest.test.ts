import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * A runtime dependency is installed by every consumer of this package, so one
 * the source never imports is pure cost to them — a download, a lockfile entry,
 * and a third-party project they now depend on staying maintained.
 *
 * `clsx` was exactly that. It sat in `dependencies` from the initial scaffold,
 * and no file in `src/` ever imported it (`git log -S` finds no import in the
 * history at all). It also failed the suite's third-party freshness bar, so it
 * was a stale dependency shipped to everyone for nothing.
 *
 * The list of dependencies comes from package.json itself, so a new one is
 * covered without anyone remembering to add it here.
 */

const root = fileURLToPath(new URL("..", import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/**
 * Package names the source imports AT RUNTIME. `import type` / `export type`
 * are excluded — they are erased at build time, so they cannot justify a
 * runtime dependency.
 */
function runtimeImports(): Set<string> {
  const names = new Set<string>();
  const statics = /^\s*(?:import|export)\s+(?!type\s)(?:[^'"]*?\sfrom\s*)?["']([^"']+)["']/gm;
  const dynamics = /\bimport\(\s*["']([^"']+)["']\s*\)/g;

  for (const file of sourceFiles(join(root, "src"))) {
    const text = readFileSync(file, "utf8");
    for (const match of [...text.matchAll(statics), ...text.matchAll(dynamics)]) {
      const specifier = match[1]!;
      if (specifier.startsWith(".") || specifier.startsWith("node:")) continue;
      const parts = specifier.split("/");
      names.add(specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!);
    }
  }
  return names;
}

describe("runtime dependencies", () => {
  const imports = runtimeImports();

  it("reads the source the way the build does (controls for the check below)", () => {
    // Known positives: without these, a scanner that matched nothing would
    // report every dependency unused and the real check would be meaningless
    // in the other direction.
    expect(imports.has("react")).toBe(true);
    expect(imports.has("@particle-academy/react-fancy")).toBe(true);
    // Known negative: src/live.ts imports fancy-query with `import type`,
    // which is erased, and must not count as a runtime use.
    expect(imports.has("@particle-academy/fancy-query")).toBe(false);
  });

  it("are all imported by the source", () => {
    for (const name of Object.keys(pkg.dependencies ?? {})) {
      expect(imports.has(name), `"${name}" is a runtime dependency that nothing in src/ imports`).toBe(true);
    }
  });
});
