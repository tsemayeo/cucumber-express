## Context

`validateResponse` compares DataTable rows against a response object. Expected values are currently always literals or built-in specials (`<null>`, `<present>`). There is no mechanism to reference values captured dynamically during a scenario — a common need when an earlier step produces an ID or token that a later step must validate.

The project already uses Cucumber; Cucumber worlds are the standard mechanism for sharing state across steps within a scenario.

## Goals / Non-Goals

**Goals:**
- Allow `{key}` in an expected cell to be resolved from a scenario-scoped captures map
- Keep the world optional so existing call sites require no changes
- Keep `parse`, `resolve`, `evaluate`, and `types` unchanged

**Non-Goals:**
- Partial string interpolation (e.g. `prefix-{id}`) — whole-cell replacement only
- Automatic population of captures — callers manage their own `world.captures.set(...)` calls
- Capturing values from the response automatically

## Decisions

**`{key}` syntax over `<key>`**
The built-in specials (`<null>`, `<present>`) already occupy the angle-bracket namespace. Using curly braces for captures creates a clean visual and logical separation — no reserved-word list, no collision risk. Rationale: two distinct namespaces are easier to reason about than one shared namespace with exceptions.

**Resolution as a pre-processing step in `validateResponse`, not inside `evaluate`/`matches`**
The core evaluation chain (`parse` → `resolve` → `evaluate` → `matches`) is pure and stateless. Introducing world state into that chain would couple it to Cucumber's runtime model. Instead, capture resolution is a single transform on the `expected` string before `evaluate` is called, preserving the purity of the evaluation chain. Alternative considered: threading `world` through to `matches()` — rejected because it pollutes a general-purpose utility with Cucumber-specific concerns.

**`world` as an optional parameter (not a wrapper function)**
Adding `world?: ScenarioWorld` as a third parameter to `validateResponse` is backward-compatible and keeps the API surface minimal. Alternative considered: factory function `validateResponseWith(world)` returning a configured `validateResponse` — rejected as unnecessary indirection for a single optional concern.

**Throw on missing capture key**
A `{key}` token with no matching entry in captures is almost certainly a test authoring mistake. Silently passing the literal string `{userId}` to comparison would produce a confusing assertion failure. A clear error — `Capture "{userId}" not found in world.captures` — surfaces the bug at the right level.

## Risks / Trade-offs

[`{` in literal expected values] → Any expected string that genuinely starts with `{` and ends with `}` matching `/^\{[^}]+\}$/` would be misinterpreted as a capture. Mitigation: this pattern is vanishingly rare in real API response values; document it as a known reserved pattern.

[World is Cucumber-specific] → `ScenarioWorld` lives in `src/world/` but has no Cucumber dependency — it's a plain class. Callers wire it into Cucumber's world via `setWorldConstructor`. This keeps the library code framework-agnostic while still serving the Cucumber use case.

## Migration Plan

No breaking changes. Existing calls to `validateResponse(table, response)` continue to work unchanged. New calls add `world` as a third argument when capture resolution is needed.
