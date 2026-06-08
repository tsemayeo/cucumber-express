## Context

The library ships with unit tests (Vitest) that cover individual functions in isolation. There is no end-to-end verification that the pieces work together inside a real Cucumber scenario — step definitions, world setup, DataTable parsing, schema loading, and API response handling all connected.

Adding functional examples fills this gap. Each example is a self-contained folder with its own feature files, step definitions, world, and cucumber config. A developer can `cd` into any one and understand it completely without reading the others.

## Goals / Non-Goals

**Goals:**
- Three independently runnable Cucumber examples
- TypeScript step definitions (consistent with the rest of the project)
- Cover all major public API surface: `assertResponse`, `buildRequest`, `buildFromSchema`, `ScenarioWorld`
- Use a real external API (dummyjson.com) for examples that assert against responses

**Non-Goals:**
- Publishing examples as part of the npm package
- Mock HTTP servers or test doubles for the API
- Full CI integration of the examples (for now)

## Decisions

### TypeScript step definitions via `tsx`

**Decision:** Add `tsx` as a devDependency and use Cucumber's `--loader tsx/esm` option.

**Rationale:** The project is TypeScript throughout. Using plain JS step definitions would create a jarring inconsistency. `tsx` is the simplest ESM-compatible TypeScript loader — no `tsconfig` changes needed, no compile step, and it correctly resolves `.js`-extension imports (which the main source uses under `NodeNext` module resolution) back to their `.ts` source files.

**Alternative considered:** `ts-node` — more complex ESM configuration required (`ts-node/esm` loader + `tsconfig.json` `module: NodeNext` interaction is fragile). `tsx` is the community-preferred replacement.

### Three separate folders, each self-contained

**Decision:** `examples/assertions/`, `examples/building-and-schemas/`, `examples/full-flow/` — each with its own `cucumber.js`, `world.ts`, and `steps/`.

**Rationale:** A developer looking at one example should not need to understand the others. Shared step definition files create invisible coupling. Three separate npm scripts (`example:assertions`, `example:building-schemas`, `example:full-flow`) let you run exactly what you care about.

**Alternative considered:** One `examples/` folder with shared steps and a single config — simpler, but the full-flow example would pull in assertions and building step definitions, making it harder to follow.

### Import from `src/` rather than `dist/`

**Decision:** Step definitions import from `../../src/index.ts` (not `../../dist/index.js`).

**Rationale:** `tsx` resolves TypeScript source directly, so no build step is needed before running examples. This reduces friction when iterating. The tradeoff is that examples test the source rather than the compiled output — acceptable for local development use.

### dummyjson.com as the external API

**Decision:** Use `https://dummyjson.com` for examples that make HTTP calls.

**Rationale:** Richer response shapes than jsonplaceholder — products have nested objects (`meta`, `dimensions`), numeric fields (`price`, `rating`, `stock`), string arrays (`tags`), and object arrays (`reviews`). This exercises more of the assertion surface. Stable and no authentication required. `POST /products/add` echoes the payload back with an `id`, enabling capture/lookup demonstrations.

### Schemas in a `schemas/` subdirectory per example

**Decision:** Examples that use `buildFromSchema` keep schema feature files in `<example>/schemas/models.feature`, separate from `<example>/features/`.

**Rationale:** Cucumber should not attempt to run schema definition files as feature files — they contain `Schema:` blocks, not `Scenario:` blocks. Keeping them in a separate directory makes the cucumber `paths` glob unambiguous.

## Risks / Trade-offs

- **Network dependency** — `assertions` and `full-flow` examples fail if dummyjson.com is unavailable. Mitigation: the examples are for local development only, not CI.
- **dummyjson response shape changes** — if the API changes field names or structure, asserted values break. Mitigation: use regex for volatile fields (descriptions, long strings); assert stable fields (id, category, stock type) literally.
- **tsx resolution edge cases** — `tsx` resolves `.js` imports to `.ts` source, but this behaviour is unofficial. Mitigation: pin `tsx` version; if this breaks, switching to `dist/` imports is a one-line change per step file.
