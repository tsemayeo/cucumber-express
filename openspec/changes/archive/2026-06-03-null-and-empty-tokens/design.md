## Context

The `<key>` angle-bracket syntax currently serves one purpose in both `buildRequest` and `assertResponse`: look up a value from `world.captures`. Two reserved tokens already exist in the assert context (`<null>`, `<present>`), implemented via a negative lookahead in the lookup regex and special-cased in the `matches` function. This change extends that pattern to add `<null>` and `<empty>` on the build side, and `<empty>` on the assert side.

## Goals / Non-Goals

**Goals:**
- Allow `<null>` in `buildRequest` to set a field to `null`
- Allow `<empty>` in `buildRequest` to set a field to `[]`
- Allow `<empty>` in `assertResponse` to assert a field is an empty array
- Reserve both tokens so they cannot be used as capture key names in either context

**Non-Goals:**
- General type-coercion via angle brackets (e.g. `<42>`, `<true>`) — deferred
- Resetting object fields to `{}` — not requested

## Decisions

**Reserve via negative lookahead in lookup regex (assert side)**

`evaluate.ts` already uses `/^<(?!null>|present>)([^>]+)>$/` to exclude reserved words from lookup dispatch. Extending this to `(?!null>|present>|empty>)` is the natural continuation — consistent, zero new infrastructure.

**Special-case before world dispatch in parseValue (build side)**

`parseValue` dispatches on `LOOKUP_REGEX` match. Reserved tokens are caught first (before checking for world), identical to the existing pattern we're introducing. `<null>` returns `null`; `<empty>` returns `[]`.

**`<empty>` on assert: Array.isArray(value) && value.length === 0**

Passes only for an actual empty array. `null`, `undefined`, empty string, and empty object all fail. This is the strictest useful definition.

**Reject reserved tokens combined with type cast prefix**

`(int) <null>` is nonsensical. `validateBuildValue` already validates cast+lookup forms; adding a check that `<null>` and `<empty>` are not used as the lookup target inside a cast keeps the invariant clean.

## Risks / Trade-offs

- `<empty>` as an assert special means users cannot look up a capture key literally named `"empty"` — acceptable since that would be an odd key name and the reservation is consistent with `null` and `present`.
- Returning a new `[]` on every `<empty>` build call means the caller gets a fresh array each time, not a shared reference — this is correct behaviour.
