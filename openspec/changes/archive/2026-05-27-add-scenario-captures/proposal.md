## Why

Cucumber step definitions often need to validate dynamic values — IDs, tokens, or names generated in earlier steps — but `validateResponse` currently only supports literal expected values. A scenario-scoped capture store lets steps stash dynamic values and reference them symbolically in later validations.

## What Changes

- **New**: `ScenarioWorld` class (`src/world/index.ts`) with a `captures: Map<string, string>` property for storing scenario-scoped key/value pairs.
- **Modified**: `validateResponse` gains an optional third parameter `world?: ScenarioWorld`. When provided, any `expected` cell matching `{key}` exactly is resolved from `world.captures` before comparison. An error is thrown if the key is not found in captures.
- Literal values (`John`), built-in specials (`<null>`, `<present>`), and partial strings (`prefix-{id}`) are all unchanged — only a whole-cell `{key}` pattern triggers a capture lookup.

## Capabilities

### New Capabilities
- `scenario-world`: A Cucumber world class that holds a scenario-scoped `captures` map for storing and retrieving dynamic string values across steps.

### Modified Capabilities
- `response-validation`: `validateResponse` gains an optional `world` parameter; expected values matching `{key}` are resolved from captures before comparison.

## Impact

- `src/world/index.ts` — new file
- `src/validate/index.ts` — signature change (optional third param, backward-compatible)
- `test/world/world.test.ts` — new test file
- `test/validate/validate.test.ts` — extended with capture resolution cases
- No changes to `parse.ts`, `resolve.ts`, `evaluate.ts`, or `types.ts`
