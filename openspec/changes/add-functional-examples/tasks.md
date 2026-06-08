## 1. Setup

- [x] 1.1 Add `tsx` to `devDependencies` in `package.json`
- [x] 1.2 Add `example:assertions`, `example:building-schemas`, and `example:full-flow` scripts to `package.json`

## 2. Assertions Example

- [x] 2.1 Create `examples/assertions/cucumber.js` with `loader: ['tsx/esm']`, paths pointing to `examples/assertions/features/**`, and imports for world and steps
- [x] 2.2 Create `examples/assertions/world.ts` extending `ScenarioWorld` with a `response` field and registering it as the world constructor
- [x] 2.3 Create `examples/assertions/steps/assertions.steps.ts` with step definitions: fetch product by id, fetch products by category, and `Then the response should match:`
- [x] 2.4 Create `examples/assertions/features/assertions.feature` with scenarios covering: literal + typed assertions, regex assertions, nested path assertions, captures + lookups, and all three array operators (`[*]`, `[+]`, `[-]`)
- [x] 2.5 Run `npm run example:assertions` and verify all scenarios pass

## 3. Building and Schemas Example

- [ ] 3.1 Create `examples/building-and-schemas/cucumber.js` with loader, paths, and imports
- [ ] 3.2 Create `examples/building-and-schemas/world.ts` loading schemas from `examples/building-and-schemas/schemas/**/*.feature` and adding `request` and `captures` to the world
- [ ] 3.3 Create `examples/building-and-schemas/schemas/models.feature` with `Schema:` definitions: `Product` (base), `CartItem` (with faker and typed fields), `Order` (extends Product, sub-schema, typed array)
- [ ] 3.4 Create `examples/building-and-schemas/steps/building.steps.ts` with step definitions for `buildRequest` and `buildFromSchema`, plus assertion steps for inspecting the built object
- [ ] 3.5 Create `examples/building-and-schemas/features/building.feature` with scenarios covering: `buildRequest` type casts, `<null>`/`<empty>` tokens, world lookup, `buildFromSchema` with no overrides, field override, and `(array:N)` resize
- [ ] 3.6 Run `npm run example:building-schemas` and verify all scenarios pass

## 4. Full-Flow Example

- [ ] 4.1 Create `examples/full-flow/cucumber.js` with loader, paths, and imports
- [ ] 4.2 Create `examples/full-flow/world.ts` loading schemas from `examples/full-flow/schemas/**/*.feature` and adding `request` and `response` fields
- [ ] 4.3 Create `examples/full-flow/schemas/models.feature` with a `NewProduct` schema using faker for title and typed fields for price and stock
- [ ] 4.4 Create `examples/full-flow/steps/full-flow.steps.ts` with step definitions: build request from schema, POST to dummyjson `/products/add`, GET `/products?limit=5`, and `Then the response should match:`
- [ ] 4.5 Create `examples/full-flow/features/full-flow.feature` as a single coherent narrative: build product → POST → capture `{newProductId}` → GET list → `[+]`/`[*]` array assertions
- [ ] 4.6 Run `npm run example:full-flow` and verify all scenarios pass
