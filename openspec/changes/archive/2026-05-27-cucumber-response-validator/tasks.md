## 1. Project Setup

- [x] 1.1 Initialise npm package with `package.json` (name: `cucumber-response-validator`, main entry, peer dep on cucumber-js)
- [x] 1.2 Set up project structure: `src/`, `test/`, entry point `src/index.js`
- [x] 1.3 Add test runner (Vitest) and configure `npm test`

## 2. Path Parser

- [x] 2.1 Implement `parsePath(pathString)` — splits a dot-separated path into typed segments: `{ type: 'key', value }` or `{ type: 'arrayOp', op, key }`
- [x] 2.2 Handle array operator syntax: `[0]` → index, `[*]` → some, `[+]` → all, `[-]` → none
- [x] 2.3 Write unit tests for `parsePath` covering plain keys, nested keys, and all four array operator forms

## 3. Path Traversal

- [x] 3.1 Implement `resolvePath(segments, obj)` — walks segments against the object, returns the resolved value
- [x] 3.2 Handle `key` segments: throw a descriptive error if the key is not present on the current object
- [x] 3.3 Handle `arrayOp` index segment: resolve `[n]`, throw if index is out of bounds
- [x] 3.4 Handle `arrayOp` some `[*]`: collect values for the remaining sub-path across all elements, return array of resolved values
- [x] 3.5 Handle `arrayOp` all `[+]` and none `[-]`: resolve sub-path across all elements, return array of resolved values
- [x] 3.6 Write unit tests for `resolvePath` covering nested objects, each array operator, and error cases

## 4. Validation Logic

- [x] 4.1 Implement `evaluateRow(path, expected, rootObject)` — parse path, resolve value, coerce to string via `String()`, compare to expected
- [x] 4.2 Apply array operator semantics: `[*]` passes if any resolved value matches; `[+]` passes if all match; `[-]` passes if none match
- [x] 4.3 Return a failure string (not throw) when comparison fails, so failures can be collected
- [x] 4.4 Write unit tests for `evaluateRow` covering match, mismatch, each array operator, and string coercion (number, boolean, null)

## 5. Public API

- [x] 5.1 Implement `validateResponse(dataTable, responseObject)` — iterate `dataTable.rows()`, call `evaluateRow` per row, collect failures, throw if any
- [x] 5.2 Format the thrown error message: one line per failure showing path, expected, and received values
- [x] 5.3 Export `validateResponse` as the sole named export from `src/index.js`
- [x] 5.4 Write integration tests using a real cucumber DataTable stub and a sample response object, covering: all-pass, single failure, multiple failures, each array operator end-to-end

## 6. Documentation

- [x] 6.1 Write `README.md` with install instructions, usage example in a cucumber step, and the full path syntax reference (dot notation + all four array operators)
