## 1. ScenarioWorld class

- [x] 1.1 Create `src/world/index.ts` exporting `ScenarioWorld` with `captures: Map<string, string>` initialised in the constructor
- [x] 1.2 Create `test/world/world.test.ts` with tests: empty map on construction, set/get a capture value

## 2. Capture resolution in validateResponse

- [x] 2.1 Add a `resolveCapture(expected, world?)` helper in `src/validate/index.ts` that returns the resolved string for `{key}` patterns or the original string for all other values
- [x] 2.2 Update `validateResponse` signature to accept an optional third parameter `world?: ScenarioWorld`
- [x] 2.3 Apply `resolveCapture` to each `expected` value before passing to `evaluate`

## 3. Tests for capture resolution

- [x] 3.1 Add test: `{key}` resolves from captures and passes validation
- [x] 3.2 Add test: `{key}` resolves from captures but value mismatches — throws with path info
- [x] 3.3 Add test: `{key}` not in captures — throws identifying the missing key
- [x] 3.4 Add test: `<null>` and `<present>` are not looked up in captures when world is provided
- [x] 3.5 Add test: plain literal is not looked up in captures when world is provided
- [x] 3.6 Add test: calling without `world` and no `{key}` tokens behaves identically to the original signature
