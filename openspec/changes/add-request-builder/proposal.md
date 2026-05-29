## Why

The library currently supports validating API responses via data tables (`validateResponse`), but has no counterpart for constructing request objects. Users must manually build request bodies in step definitions, repeating boilerplate for every required field even when only one field matters to the scenario. A `buildRequest` function with faker integration lets each scenario declare only the data that is semantically relevant — everything else is auto-generated valid noise.

## What Changes

- Add a `buildRequest` function that takes a user-owned schema factory, a Cucumber `DataTable`, and an optional `ScenarioWorld`, and returns a fully built request object
- Table rows deep-set values into the schema's output by path, using the same dot/bracket path syntax as `validateResponse`
- Value column supports type casting: `(int)`, `(float)`, `(boolean)` prefixes; default is string
- Value column supports `<key>` lookups from `world.captures`, consistent with `validateResponse`
- Type cast and lookup can be combined: `(int)<key>`
- Array elements at missing indices are created as sparse objects containing only the specified attribute — the builder makes no assumptions about what a complete element looks like
- Export `buildRequest` from the package root alongside `validateResponse`

## Capabilities

### New Capabilities

- `request-builder`: `buildRequest` function — schema factory + data table → request object, with type casting, world lookups, and sparse array element creation

### Modified Capabilities

- `scenario-world`: No requirement changes — `ScenarioWorld` is reused as-is; `world.captures` lookups work identically to `validateResponse`

## Impact

- New source file: `src/build/index.ts`
- New test file: `test/build/build.test.ts`
- `src/index.ts` export surface gains `buildRequest`
- No changes to existing `validateResponse`, `ScenarioWorld`, or path resolution logic
- New peer dependency consideration: `@faker-js/faker` — the library does not depend on it; the schema factory is user-owned and faker usage is entirely up to the user
