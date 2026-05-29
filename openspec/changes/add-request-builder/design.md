## Context

The library exposes `validateResponse` which traverses an existing object using parsed dot/bracket paths and asserts values against it. The write-side counterpart (`buildRequest`) needs to walk the same path segments but mutate a target object, creating intermediate nodes as needed. The existing `parsePath` and `Segment` types are reused as-is — only a new `setPath` traversal function is needed.

## Goals / Non-Goals

**Goals:**
- `buildRequest(schema, table, world?)` produces a request object by calling the schema factory and deep-setting each table row into the result
- Value column supports `(int)`, `(float)`, `(boolean)` type cast prefixes; bare values are strings
- Value column supports `<key>` world lookups, combinable with type casts: `(int)<key>`
- Array elements at missing indices are created as `{}` with only the specified attribute set — no template inference
- Conflicting traversal (non-object in key path, non-array for index) throws a descriptive error

**Non-Goals:**
- No collection operators (`[*]`, `[+]`, `[-]`) on the write side — only `[n]` index paths
- No faker dependency — faker is the user's concern, the schema factory is a plain `() => T`
- No type inference from the schema to auto-coerce values — type is always explicit via prefix or defaults to string
- No sparse-hole filling — if `items[3]` is set and `items[1]` was never set, it stays a hole

## Decisions

### Reuse `parsePath` and `Segment` types unchanged
The existing `parsePath` parses dot/bracket paths into `Segment[]`. The write side uses the same segments. Only the traversal function differs (set vs get). Collection segments (`some`, `all`, `none`) are rejected at set-time with a clear error rather than at parse time, keeping `parsePath` unchanged and shared.

**Alternative considered:** A separate write-side parser that rejects collection operators at parse time. Rejected — it would duplicate the tokeniser logic for a minor gain.

### `setPath` creates intermediate nodes on demand
When a `key` segment points to a missing key, `setPath` creates `{}`. When an `index` segment points to a missing or out-of-bounds array slot, `setPath` creates `[]` if needed and sets the element to `{}`. This is the "create what the table says, nothing more" contract.

**Alternative considered:** Throw when the schema doesn't define the path. Rejected — users legitimately want to add fields not present in the schema.

### Type casting parsed from value string before world lookup
Parsing order: strip `(type)` prefix → resolve `<key>` lookup if present → cast result to type. This means `(int)<capturedValue>` reads the captured string and parses it as an integer, which is the natural expectation.

**Alternative considered:** Type cast after lookup only. Same outcome — just made explicit that the prefix wraps the whole value expression.

### Value syntax is a strict subset of `validateResponse`'s value column
`buildRequest` supports `<key>` lookups and `(type)` casts. It does not support `{key}` captures, `{key:/regex/}` capture gates, `/regex/` assertions, `<null>`, or `<present>` — those are assertion constructs that have no meaning when writing. `<null>` is the only potential addition worth revisiting later (explicitly setting a field to `null`).

## Risks / Trade-offs

- **Sparse arrays** — setting `items[3]` when `items` has 0 elements creates holes at `[0]`–`[2]`. JavaScript allows this; serialisers (JSON.stringify) render holes as `null`. Acceptable — the user controls what indices they write to.
- **Type string → cast errors** — `(int)abc` → `NaN`. We propagate NaN rather than throw, consistent with how JavaScript's `parseInt` behaves. Could be surprising; document it.
- **Schema called once per `buildRequest` call** — faker values are generated at call time, not lazily per field. This is a feature: the user's factory controls exactly when and how values are generated.
