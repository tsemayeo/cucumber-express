## Context

The library exposes `validateResponse` and `buildRequest`. Both accept a `DataTable` whose rows contain a path column and a value column. Currently:

- Parsers (`parsePath`, `parseValue`) silently accept malformed input: `items[]` maps to index 0, `(int) abc` returns `NaN`, `(boolean) maybe` returns `false`, and a malformed `{key:/unclosed(}` gate is treated as a literal string. These silent wrongs produce incorrect test results with no diagnostic.
- The name `validateResponse` is confused with schema validation; the function *asserts* expected values.

## Goals / Non-Goals

**Goals:**
- Rename `validateResponse` → `assertResponse` in the public API and internal module
- Add a single validation pass over the DataTable (both path and value columns) that collects all syntax errors and throws them together, before any parsing or execution
- Fix two adjacent correctness bugs: wrong bounds check in `navigateIndex`/`assignIndex`, and misleading "got object" error message for null values

**Non-Goals:**
- Changing runtime behavior for syntactically valid input (all passing tables continue to work)
- Adding new path or value syntax
- Extending validation to cover runtime conditions (missing keys, world lookups, index out of bounds)

## Decisions

### 1. Collect all syntax errors before throwing (vs. fail on first)

Both `assertResponse` and `buildRequest` already collect all row-level *value* failures before throwing. Syntax validation follows the same pattern: every row's path and value are checked, all errors are accumulated, then thrown together in one message. This gives authors a complete picture of what's wrong in their table.

### 2. New `src/util/syntax.ts` (vs. making parsers stricter)

Embedding validation logic inside `parsePath`/`parseValue` would conflate parsing with validation and require parsers to throw on previously-silent inputs, changing their contract. A dedicated `syntax.ts` keeps validation as an explicit, testable phase that both `assertResponse` and `buildRequest` call before touching parsers. Parsers remain pure transformers that assume valid input.

Exports:
```
validatePath(path: string): string | null
validateAssertValue(value: string): string | null
validateBuildValue(value: string): string | null
```

Each returns `null` on success or a human-readable error string on failure.

### 3. Full module rename (vs. function-only rename)

`src/validate/` → `src/assert/` and `test/validate/` → `test/assert/` keeps internal naming consistent with the public API. A function-only rename with a module still named `validate/` would create permanent internal confusion.

### 4. Path validation via re-tokenisation (vs. regex on the full string)

The same tokenisation regex already used in `parsePath` (`/[^.[\]]+|\[[^\]]*\]/g`) is reused in `validatePath` to split the path, then each token is validated individually. This avoids duplicating parsing logic and keeps the two in sync. The additional rules checked at this level:
- Empty token list (empty string, bare dots) → error
- Any bracket token whose inner content is not `*`, `+`, `-`, or a non-negative integer → error (catches `[]`, `[abc]`, negative indices)
- Leading/trailing/double dots produce empty string tokens, which are caught as empty keys → error

### 5. Value validation for build: NaN detection at validation time

For `(int)` and `(float)` casts, the validator attempts the parse (`parseInt`/`parseFloat`) and checks for `NaN` or non-finite results. This keeps the detection logic co-located with the validation phase. For `(boolean)`, only the strings `"true"` and `"false"` are accepted. Combined cast+lookup forms `(int) <key>` are not validated for numeric content (the key's value is only known at runtime).

### 6. Value validation for assert: regex pre-compilation

For `/pattern/` and `{key:/pattern/}` forms, the validator attempts `new RegExp(pattern)` inside a try/catch. Invalid regex patterns throw a `SyntaxError`; valid ones are discarded. This is the same mechanism the runtime would use, so validation is never wrong about what the engine accepts.

## Risks / Trade-offs

- **Breaking rename** → Mitigation: package is pre-1.0, no deprecation period needed; update is a one-word find-and-replace for callers
- **Syntax errors thrown before execution errors** → Minor ordering change; for tables with both syntax errors and value mismatches, authors see syntax errors first and must fix them before seeing value failures. This is intentional and beneficial.
- **`(int) <key>` not validated at syntax time** → The cast's target is only known at runtime; this is acceptable because the cast syntax itself is valid. Runtime NaN would still surface as a wrong value in the object (downstream assertion failure), though a future change could add runtime cast validation.

## Migration Plan

1. Callers replace `validateResponse(` with `assertResponse(`
2. No other changes required for valid input; malformed tables that were silently wrong will now throw at the syntax phase
