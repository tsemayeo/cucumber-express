## Why

The current `{key}` lookup mechanism is limited — it requires captures to be populated manually outside of `validateResponse`, and there is no way to capture values from a response or assert against regex patterns within a DataTable step. This change introduces a richer expected-column vocabulary that lets a single DataTable row both capture dynamic values and assert against patterns, enabling more expressive Cucumber steps.

## What Changes

- **BREAKING**: `{key}` in the expected column now **writes** to `world.captures` (captures the resolved value) instead of reading from it.
- **New**: `<key>` in the expected column **reads** from `world.captures` and asserts the resolved value equals the captured value — replacing the former role of `{key}`.
- **New**: `{key:/regex/}` — capture gate: asserts the resolved value matches the regex; if it does, stores the full value (or capture group 1 if the regex contains a group) into `world.captures`. Fails the row if the value does not match.
- **New**: `/regex/` — asserts the resolved value matches a regex pattern. No capture side-effect.
- `<null>`, `<present>`, and literal comparisons are unchanged.
- `<null>` and `<present>` are reserved — they cannot be used as capture key names.

## Capabilities

### New Capabilities
_(none — all changes are within the existing response-validation capability)_

### Modified Capabilities
- `response-validation`: The "Validate object values via dot-path" requirement changes to describe the full expected-column vocabulary: capture (`{key}`, `{key:/regex/}`), lookup (`<key>`), regex assertion (`/regex/`), built-in specials, and literals. The current capture-lookup behaviour of `{key}` is a breaking change.

## Impact

- `src/validate/evaluate.ts` — replace `resolveCapture` and `CAPTURE_REGEX` with new dispatch logic covering all five expected-column forms
- `src/validate/index.ts` — no signature changes (world param already present)
- `test/validate/evaluate.test.ts` — add tests for all new forms
- `test/validate/validate.test.ts` — update existing capture tests that relied on the old `{key}` lookup semantics
- No changes to `parse.ts`, `resolve.ts`, `types.ts`, or `src/world/`
