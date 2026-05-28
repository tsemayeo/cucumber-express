## Context

cucumber-js step definitions need a clean, reusable way to assert values in a response object using Gherkin data tables. Currently there is no standard helper — each project writes its own. This library provides a single function that handles path traversal, array operations, and failure collection.

## Goals / Non-Goals

**Goals:**
- Single exported function `validateResponse(dataTable, responseObject)` with no side effects
- Dot-separated path traversal into arbitrary nested JS objects
- Four array operators: `[n]` (index), `[*]` (some), `[+]` (all), `[-]` (none)
- String-to-string value comparison throughout
- Collect all row failures before throwing a single descriptive error
- Zero runtime dependencies beyond cucumber-js as a peer

**Non-Goals:**
- Type coercion (numbers, booleans, null)
- Nested array operators (`items[0].tags[*]`)
- Auto-registering cucumber step definitions
- HTTP response parsing or adapters
- JSON Schema or regex matching

## Decisions

### Path parsing strategy: split then classify each segment

Parse the full path string once into a list of typed segments before traversal. Each segment is either a plain key or an array operation.

```
"body.items[*].status"
→ [ key("body"), key("items"), arrayOp("*"), key("status") ]
```

**Alternatives considered:**
- Recursive regex match during traversal — harder to reason about and test in isolation
- JSONPath library — adds a dependency and more surface area than needed

### Array operator placement: mid-path, not terminal

Array operators appear between two key segments. The segment before the operator resolves to an array; the segment(s) after apply to each element. This keeps paths readable and mirrors how you'd describe the data verbally.

**Alternative:** Terminal operators (`body.items.status[*]`) — less natural to read.

### Failure collection: array of error strings, throw once

Each row evaluation appends to a `failures[]` array. After all rows are processed, if `failures.length > 0`, throw a single `Error` whose message is the joined list.

**Alternative:** Throw on first failure — faster but forces fix-one-at-a-time cycles.

### Value coercion: none — stringify both sides

Convert the actual resolved value to a string via `String(value)` before comparing to the expected string from the table. This avoids a class of subtle type bugs and keeps the contract simple.

**Risk:** `String(null)` is `"null"`, `String(undefined)` is `"undefined"` — users must write those literal strings in the table if they need to assert them. Documented behaviour, not a bug.

## Risks / Trade-offs

- **String-only comparison is limiting** → Acceptable for v1; type coercion can be layered in later without breaking the API
- **No nested array operators** → Users with `items[0].tags[*]` paths need a workaround; explicitly out of scope
- **`String(value)` coercion surprises** → Mitigated by clear documentation of the behaviour for `null`/`undefined`/objects

## Open Questions

(none — all design decisions resolved in exploration)
