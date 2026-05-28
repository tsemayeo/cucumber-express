## Why

Writing response validation in cucumber-js step definitions is repetitive and verbose — teams end up writing bespoke assertion logic for every test. A shared helper that reads directly from a Gherkin data table keeps validation declarative, readable, and co-located with the test intent.

## What Changes

- Introduce a new npm library `cucumber-response-validator` exposing a single `validateResponse(dataTable, responseObject)` function
- Path traversal supports dot notation and four array operators (`[n]`, `[*]`, `[+]`, `[-]`) for flexible validation of nested and collection data
- All validation failures are collected before throwing, surfacing every mismatch in a single error

## Capabilities

### New Capabilities

- `response-validation`: Core validation function — accepts a cucumber DataTable and a plain JS object, traverses dot-separated paths, applies array operators, compares values as strings, and throws a collected error on any mismatch

### Modified Capabilities

(none — this is a new library)

## Impact

- New standalone npm package with no runtime dependencies beyond cucumber-js as a peer dependency
- Users integrate by importing `validateResponse` and calling it inside their own step definitions
- No changes to existing code — purely additive
