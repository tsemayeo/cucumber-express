## Why

The library has thorough unit tests but no way to see it working end-to-end inside real Cucumber scenarios. Running actual Cucumber against a live API is the only way to verify the full integration — step definitions, world setup, DataTable parsing, schema loading — all together.

## What Changes

- Add three self-contained example folders under `examples/`, each runnable independently with its own cucumber config
- Add `tsx` as a dev dependency for running TypeScript step definitions with Cucumber
- Add three `npm run example:*` scripts to `package.json`

## Capabilities

### New Capabilities

- `example-assertions`: A standalone Cucumber example demonstrating `assertResponse` — literal values, type casts, regex, nested paths, captures, lookups, and array operators against the dummyjson.com API
- `example-building-schemas`: A standalone Cucumber example demonstrating `buildRequest` and `buildFromSchema` with type casts, world lookups, `<null>/<empty>` tokens, schema inheritance, faker, and `(array:N)` overrides — fully in-memory, no API
- `example-full-flow`: A standalone Cucumber example combining the entire pipeline — build a payload from schema, POST it, capture the response ID, fetch a list, and assert array fields — using dummyjson.com

### Modified Capabilities

## Impact

- New `examples/` directory at project root (not part of `src/` or `test/`)
- `tsx` added to `devDependencies`
- Three new scripts in `package.json`: `example:assertions`, `example:building-schemas`, `example:full-flow`
- No changes to source code or existing tests
