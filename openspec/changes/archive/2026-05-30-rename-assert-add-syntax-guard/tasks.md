## 1. Rename module and function

- [x] 1.1 Rename directory `src/validate/` → `src/assert/` and update all internal imports within those files
- [x] 1.2 Rename exported function `validateResponse` → `assertResponse` in `src/assert/index.ts`
- [x] 1.3 Update re-export in `src/index.ts`: `export { assertResponse } from './assert/index.js'`
- [x] 1.4 Rename test directory `test/validate/` → `test/assert/` and update imports and function references within those files
- [x] 1.5 Update `README.md`: replace all occurrences of `validateResponse` with `assertResponse`

## 2. Add `src/util/syntax.ts`

- [x] 2.1 Implement `validatePath(path: string): string | null` — tokenise path and reject: empty result, empty key tokens (catches leading/trailing/double dots), and bracket tokens that are not `[*]`, `[+]`, `[-]`, or a non-negative integer (catches `[]`)
- [x] 2.2 Implement `validateAssertValue(value: string): string | null` — reject `/pattern/` where pattern fails `new RegExp()`, and `{key:/pattern/}` where pattern fails `new RegExp()`; treat `{key:/unclosed}` (no closing `/{`) as a syntax error
- [x] 2.3 Implement `validateBuildValue(value: string): string | null` — for `(int) x` reject if x (after stripping `<key>` lookup form) parses to NaN or non-finite; for `(float) x` same; for `(boolean) x` reject unless x is exactly `"true"` or `"false"`

## 3. Wire validation into both functions

- [x] 3.1 In `src/assert/index.ts`: add Phase 1 pass — iterate all rows, call `validatePath` and `validateAssertValue`, collect non-null results, throw joined error if any before the existing evaluate loop
- [x] 3.2 In `src/build/index.ts`: add Phase 1 pass — iterate all rows, call `validatePath` and `validateBuildValue`, collect non-null results, throw joined error if any before the existing setPath loop

## 4. Fix adjacent bugs

- [x] 4.1 In `src/build/setpath.ts` `navigateIndex` (line ~28): replace `object[index] === undefined` with `index < 0 || index >= object.length`
- [x] 4.2 In `src/build/setpath.ts` `assignIndex` (line ~45): same bounds check fix
- [x] 4.3 In `src/assert/resolve.ts` and `src/build/setpath.ts` (3 throw sites): replace `typeof object` with `object === null ? 'null' : Array.isArray(object) ? 'array' : typeof object` in error messages

## 5. Tests

- [x] 5.1 Add `test/util/syntax.test.ts` covering `validatePath`: empty string, bare dot, leading dot, trailing dot, double dot, `items[]`, valid paths (key, index, `[*]`, `[+]`, `[-]`)
- [x] 5.2 Add tests for `validateAssertValue`: invalid regex in `/pattern/`, invalid regex in `{key:/pattern/}`, malformed gate `{key:/unclosed}`, valid forms
- [x] 5.3 Add tests for `validateBuildValue`: `(int) abc`, `(int) ` (empty), `(float) abc`, `(boolean) maybe`, `(boolean) ` (empty), valid forms, `(int) <key>` (valid)
- [x] 5.4 Add integration tests: `assertResponse` with two bad paths throws one error containing both; `buildRequest` with bad path and bad value throws one error containing both
- [x] 5.5 Add test for `navigateIndex` fix: array `[1, undefined, 3]` at index 1 no longer throws out-of-bounds
- [x] 5.6 Run full test suite and confirm all existing tests pass
