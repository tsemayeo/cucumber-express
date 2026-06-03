## 1. Build — Reserved Tokens in parseValue

- [x] 1.1 In `src/build/parsevalue.ts`, special-case `key === 'null'` before world dispatch to return `null`
- [x] 1.2 In `src/build/parsevalue.ts`, special-case `key === 'empty'` before world dispatch to return `[]`

## 2. Syntax Validation — Reject Cast + Reserved Token

- [x] 2.1 In `src/util/syntax.ts`, update `validateBuildValue` to reject `(type) <null>` and `(type) <empty>` combinations with a descriptive error

## 3. Assert — `<empty>` Built-in Special

- [x] 3.1 In `src/assert/evaluate.ts`, add `empty>` to the negative lookahead in `LOOKUP_REGEX` so `<empty>` is not dispatched as a capture lookup
- [x] 3.2 In `src/assert/evaluate.ts`, add `if (expected === '<empty>') return Array.isArray(value) && value.length === 0` in the `matches` function

## 4. Tests — Build

- [x] 4.1 In `test/build/build.test.ts`, add test: `<null>` sets a field to `null`
- [x] 4.2 In `test/build/build.test.ts`, add test: `<null>` works without a world argument
- [x] 4.3 In `test/build/build.test.ts`, add test: `<empty>` sets a field to `[]`
- [x] 4.4 In `test/build/build.test.ts`, add test: `<empty>` works without a world argument

## 5. Tests — Syntax Validation

- [x] 5.1 In `test/util/syntax.test.ts`, add tests: `(int) <null>` and `(boolean) <null>` are rejected
- [x] 5.2 In `test/util/syntax.test.ts`, add tests: `(int) <empty>` and `(string) <empty>` are rejected
- [x] 5.3 In `test/util/syntax.test.ts`, add tests: bare `<null>` and `<empty>` pass validation

## 6. Tests — Assert

- [x] 6.1 In the assert test suite, add test: `<empty>` passes for `[]`
- [x] 6.2 In the assert test suite, add test: `<empty>` fails for a non-empty array
- [x] 6.3 In the assert test suite, add test: `<empty>` fails for `null`
- [x] 6.4 In the assert test suite, add test: `<empty>` fails for a non-array value
- [x] 6.5 In the assert test suite, add test: `<empty>` works without a world argument
