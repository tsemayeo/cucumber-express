## 1. Setup

- [x] 1.1 Add `tsx` to `devDependencies` in `package.json`
- [x] 1.2 Add `example:assertions`, `example:building`, `example:schemas`, and `example:full-flow` scripts to `package.json`

## 2. Assertions Example

- [x] 2.1 Create `examples/assertions/cucumber.js`
- [x] 2.2 Create `examples/assertions/world.ts`
- [x] 2.3 Create `examples/assertions/steps/assertions.steps.ts`
- [x] 2.4 Create `examples/assertions/features/assertions.feature`
- [x] 2.5 Run `npm run example:assertions` and verify all scenarios pass

## 3. Building Example

- [x] 3.1 Create `examples/building/` as a standalone sub-project (package.json, tsconfig.json, cucumber.js)
- [x] 3.2 Create `examples/building/world.ts` with `setWorldConstructor(ScenarioWorld)`
- [x] 3.3 Create `examples/building/steps/building.steps.ts` with step definitions for `buildRequest`
- [x] 3.4 Create `examples/building/features/building.feature` covering: schema defaults preserved, type casts, `<null>`/`<empty>` tokens, world lookup
- [x] 3.5 Run `npm run example:building` and verify all scenarios pass

## 4. Schemas Example

- [x] 4.1 Create `examples/schemas/` as a standalone sub-project (package.json, tsconfig.json, cucumber.js)
- [x] 4.2 Create `examples/schemas/world.ts` with `await ScenarioWorld.withSchemas('schemas/**/*.feature')`
- [x] 4.3 Create `examples/schemas/schemas/models.feature` with `Customer`, `AdminCustomer`, `CartItem`, `Order` schema definitions
- [x] 4.4 Create `examples/schemas/steps/schemas.steps.ts` with step definitions for `buildFromSchema`
- [x] 4.5 Create `examples/schemas/features/schemas.feature` covering: defaults, inheritance, field override, `(array:N)` resize
- [x] 4.6 Run `npm run example:schemas` and verify all scenarios pass

## 5. Full-Flow Example

- [ ] 5.1 Create `examples/full-flow/` as a standalone sub-project (package.json, tsconfig.json, cucumber.js)
- [ ] 5.2 Create `examples/full-flow/world.ts` with `await ScenarioWorld.withSchemas('schemas/**/*.feature')`
- [ ] 5.3 Create `examples/full-flow/schemas/models.feature` with a `NewProduct` schema
- [ ] 5.4 Create `examples/full-flow/steps/full-flow.steps.ts` with step definitions: build from schema, POST to dummyjson `/products/add`, GET `/products?limit=5`, assert response
- [ ] 5.5 Create `examples/full-flow/features/full-flow.feature` as a single narrative: build → POST → capture → GET list → array assertions
- [ ] 5.6 Run `npm run example:full-flow` and verify all scenarios pass
