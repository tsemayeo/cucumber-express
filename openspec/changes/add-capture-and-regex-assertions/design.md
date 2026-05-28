## Context

`validateResponse` currently supports five expected-column forms: `{key}` (capture lookup), `<null>`, `<present>`, and literals. The `{key}` lookup was introduced to reference values captured manually by step definitions. This change replaces that mechanism with a richer vocabulary: `{key}` and `{key:/regex/}` write to captures, `<key>` reads from captures, and `/regex/` asserts a pattern without capture side-effects.

All logic lives in `src/validate/evaluate.ts`. The `world` parameter threading through `evaluate` and `validateResponse` is already in place.

## Goals / Non-Goals

**Goals:**
- Replace the current `resolveCapture` / `CAPTURE_REGEX` mechanism with a unified dispatch function covering all five expected-column forms
- Introduce regex assertion (`/regex/`) and capture gate (`{key:/regex/}`) without touching `parse.ts`, `resolve.ts`, or `types.ts`
- Keep the evaluation chain stateless except for the deliberate side-effect of writing to `world.captures` on capture rows

**Non-Goals:**
- Capture group extraction beyond group 1
- Partial string interpolation (e.g. `prefix-{key}`)
- Regex flags (case-insensitive etc.) — `{key:/regex/}` and `/regex/` use the pattern as-is
- Changes to `ScenarioWorld` or `src/world/`

## Decisions

**Dispatch order in `evaluate`**
The expected string is classified in a fixed priority order before any comparison or capture:
1. `{key}` or `{key:/regex/}` → capture branch (write)
2. `<null>` or `<present>` → built-in specials
3. `<key>` → capture lookup (read)
4. `/regex/` → regex assertion
5. anything else → literal comparison

This order avoids ambiguity: built-in specials are checked before the generic `<key>` pattern so `<null>` and `<present>` are never mistaken for capture keys.

**Parsing the `{key:/regex/}` form**
Regex: `/^\{([^}:/]+):\/(.+)\/\}$/` — matches `{key:/pattern/}` and captures (1) the key name and (2) the pattern string. The colon-slash sequence `:/` acts as the unambiguous separator; a bare `/` inside the pattern does not terminate it because the outer delimiter is `\/\}$`. Alternative considered: pipe separator `{key|pattern}` — rejected because `|` is Cucumber's DataTable cell delimiter.

**Capture group rule**
If the regex (from `{key:/regex/}`) contains a capture group, `group[1]` of the match is stored. If no group, the full stringified value is stored. This is determined by checking `match[1] !== undefined` after `regex.exec(stringValue)`. Alternative: always store the full value, never extract groups — rejected as less useful when capturing from compound strings like URLs or tokens.

**Capture rows do not contribute to failures**
A `{key}` or `{key:/regex/}` row that succeeds (gate passes or no gate) produces no failure message — it is a side-effectful row, not an assertion row. A `{key:/regex/}` row that fails the gate DOES produce a failure message collected with other row failures.

**Breaking change accepted**
`{key}` formerly meant "look up from captures". Any existing tests or step definitions using `{key}` as a lookup must migrate to `<key>`. The behaviour is strictly better — callers no longer need to manually populate captures before calling `validateResponse`.

## Risks / Trade-offs

[`{` or `<` in literal values] → Any expected string starting with `{` followed by a word and `}`, or `<` followed by a word and `>`, will be misclassified. These characters are rare in real API response values and are documented as reserved patterns.

[Regex in DataTable cells] → Slashes and special characters in regex patterns must not be escaped at the Gherkin level — Cucumber passes cell values as raw strings, so the pattern is received intact. No known issues.

[Capture rows are fire-and-forget] → If a `{key}` row silently captures a bad value, later `<key>` assertions will fail with a potentially confusing mismatch. Mitigation: use `{key:/regex/}` to gate captures on expected shape.

## Migration Plan

Existing call sites using `{key}` in the expected column for lookup must change `{key}` to `<key>`. No other call-site changes needed. The `world` parameter signature is unchanged.
