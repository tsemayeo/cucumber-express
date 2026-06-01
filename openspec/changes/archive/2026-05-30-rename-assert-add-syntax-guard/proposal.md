## Why

`validateResponse` is confusingly named — "validate" implies schema validation, but the function *asserts* expected values against a live response. Separately, both `validateResponse` and `buildRequest` silently accept malformed table input (paths like `items[]`, casts like `(int) abc`, boolean values like `(boolean) maybe`) and produce wrong results — NaN, wrong indices, or `false` — with no error, which undermines confidence in the test suite.

## What Changes

- **BREAKING** Rename `validateResponse` → `assertResponse` in the public API
- Rename internal module `src/validate/` → `src/assert/` and test directory `test/validate/` → `test/assert/`
- Add upfront syntax validation to both `assertResponse` and `buildRequest`: all rows are checked before any parsing or execution; all syntax errors are collected and thrown together
- New shared path validator: rejects empty paths, leading/trailing/double dots, and empty brackets `[]`
- New value validator for `assertResponse`: rejects syntactically invalid regex patterns (in `/pattern/` and `{key:/pattern/}` forms)
- New value validator for `buildRequest`: rejects `(int)`/`(float)` values that are non-numeric and `(boolean)` values that are not exactly `true` or `false`
- Fix `navigateIndex`/`assignIndex` bounds check: replace `=== undefined` with `index >= object.length` to match `resolveIndex`
- Fix misleading "got object" error message when null is encountered at a path segment

## Capabilities

### New Capabilities

- `syntax-validation`: Upfront syntax validation of the path and value columns in DataTables, applied to both `assertResponse` and `buildRequest` before any parsing or execution occurs

### Modified Capabilities

- `response-validation`: Rename `validateResponse` → `assertResponse`; add syntax validation phase as a new requirement

## Impact

- **Breaking API change**: callers must rename `validateResponse` → `assertResponse`
- **No behavior change for valid input**: all existing passing tables continue to work identically
- Imports in `src/index.ts`, `README.md`, and all test files updated
- New file `src/util/syntax.ts`
