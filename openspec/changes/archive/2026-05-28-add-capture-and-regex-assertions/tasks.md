## 1. Rework evaluate.ts dispatch logic

- [x] 1.1 Remove `CAPTURE_REGEX` and `resolveCapture` from `evaluate.ts`
- [x] 1.2 Add regex constants for the five expected-column forms: `CAPTURE_PLAIN_REGEX` (`/^\{([^}:/]+)\}$/`), `CAPTURE_GATE_REGEX` (`/^\{([^}:/]+):\/(.+)\/\}$/`), `LOOKUP_REGEX` (`/^<(?!null>|present>)([^>]+)>$/`), `REGEX_ASSERTION_REGEX` (`/^\/(.+)\/$/`)
- [x] 1.3 Add `dispatchExpected(expected, resolved, world)` function that implements the five-branch dispatch and returns `boolean` (pass/fail) plus performs the capture side-effect where applicable
- [x] 1.4 Update `evaluate` to call `dispatchExpected` instead of the old `resolveCapture` + `evaluateRow` chain; capture rows return `null` (no failure message) on success

## 2. Update evaluateRow and matches

- [x] 2.1 Update `matches` to handle `/regex/` assertion form in addition to `<null>`, `<present>`, and literal
- [x] 2.2 Ensure `evaluateRow` delegates to the updated `matches` for collection operators (`[*]`, `[+]`, `[-]`)

## 3. Update existing tests

- [x] 3.1 In `test/validate/validate.test.ts`: update capture tests that used `{key}` as lookup — change expected cell to `<key>` form
- [x] 3.2 In `test/validate/evaluate.test.ts`: remove or update any tests relying on old `resolveCapture` behaviour

## 4. Add new tests in evaluate.test.ts

- [x] 4.1 `{key}` stores value in world.captures and returns null (no failure)
- [x] 4.2 `{key}` without world throws
- [x] 4.3 `{key:/regex/}` gate passes — stores full value, returns null
- [x] 4.4 `{key:/regex/}` with capture group — stores group 1, returns null
- [x] 4.5 `{key:/regex/}` gate fails — returns failure message, does not store
- [x] 4.6 `<key>` lookup passes when captured value matches
- [x] 4.7 `<key>` lookup fails when captured value does not match
- [x] 4.8 `<key>` lookup throws when key not in captures
- [x] 4.9 `/regex/` assertion passes when value matches
- [x] 4.10 `/regex/` assertion fails when value does not match
- [x] 4.11 `<null>` is not treated as a capture lookup
- [x] 4.12 `<present>` is not treated as a capture lookup
