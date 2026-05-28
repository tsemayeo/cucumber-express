## 1. Rework evaluate.ts dispatch logic

- [ ] 1.1 Remove `CAPTURE_REGEX` and `resolveCapture` from `evaluate.ts`
- [ ] 1.2 Add regex constants for the five expected-column forms: `CAPTURE_PLAIN_REGEX` (`/^\{([^}:/]+)\}$/`), `CAPTURE_GATE_REGEX` (`/^\{([^}:/]+):\/(.+)\/\}$/`), `LOOKUP_REGEX` (`/^<(?!null>|present>)([^>]+)>$/`), `REGEX_ASSERTION_REGEX` (`/^\/(.+)\/$/`)
- [ ] 1.3 Add `dispatchExpected(expected, resolved, world)` function that implements the five-branch dispatch and returns `boolean` (pass/fail) plus performs the capture side-effect where applicable
- [ ] 1.4 Update `evaluate` to call `dispatchExpected` instead of the old `resolveCapture` + `evaluateRow` chain; capture rows return `null` (no failure message) on success

## 2. Update evaluateRow and matches

- [ ] 2.1 Update `matches` to handle `/regex/` assertion form in addition to `<null>`, `<present>`, and literal
- [ ] 2.2 Ensure `evaluateRow` delegates to the updated `matches` for collection operators (`[*]`, `[+]`, `[-]`)

## 3. Update existing tests

- [ ] 3.1 In `test/validate/validate.test.ts`: update capture tests that used `{key}` as lookup — change expected cell to `<key>` form
- [ ] 3.2 In `test/validate/evaluate.test.ts`: remove or update any tests relying on old `resolveCapture` behaviour

## 4. Add new tests in evaluate.test.ts

- [ ] 4.1 `{key}` stores value in world.captures and returns null (no failure)
- [ ] 4.2 `{key}` without world throws
- [ ] 4.3 `{key:/regex/}` gate passes — stores full value, returns null
- [ ] 4.4 `{key:/regex/}` with capture group — stores group 1, returns null
- [ ] 4.5 `{key:/regex/}` gate fails — returns failure message, does not store
- [ ] 4.6 `<key>` lookup passes when captured value matches
- [ ] 4.7 `<key>` lookup fails when captured value does not match
- [ ] 4.8 `<key>` lookup throws when key not in captures
- [ ] 4.9 `/regex/` assertion passes when value matches
- [ ] 4.10 `/regex/` assertion fails when value does not match
- [ ] 4.11 `<null>` is not treated as a capture lookup
- [ ] 4.12 `<present>` is not treated as a capture lookup
