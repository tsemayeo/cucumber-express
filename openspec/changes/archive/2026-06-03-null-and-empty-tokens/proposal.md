## Why

When building API requests, users have no way to explicitly set a field to `null` or reset an array field to `[]`. Both are valid API values — nullable fields and empty collections — and the absence of these tokens forces workarounds or leaves gaps in test coverage.

## What Changes

- Add `<null>` as a reserved token in `buildRequest` value column — sets the field to `null`
- Add `<empty>` as a reserved token in `buildRequest` value column — sets the field to `[]`
- Add `<empty>` as a built-in special in `assertResponse` value column — passes iff the resolved value is an array with length 0
- Reserve `<null>` and `<empty>` so they cannot be used as world capture lookup keys in either context

## Capabilities

### New Capabilities

_(none — all changes extend existing capabilities)_

### Modified Capabilities

- `request-builder`: New reserved tokens `<null>` and `<empty>` for setting values in the build table
- `response-validation`: New built-in special `<empty>` for asserting an array is empty
- `syntax-validation`: Reserved token rules — `<null>` and `<empty>` are not valid capture key names in either build or assert context

## Impact

- `src/build/parsevalue.ts` — special-case `<null>` and `<empty>` before world lookup dispatch
- `src/util/syntax.ts` — update `validateBuildValue` to reject `<null>` and `<empty>` when combined with a type cast prefix (e.g. `(int) <null>` is invalid); update `validateAssertValue` to recognise `<empty>` as a valid reserved token
- Response assertion logic — add `<empty>` branch alongside existing `<null>` and `<present>` handling
- Tests across build, assert, and syntax-validation suites
