### Requirement: Standalone full-flow example folder
The `examples/full-flow/` directory SHALL be a self-contained Cucumber project with its own `cucumber.js` config, `world.ts`, `steps/` directory, `features/` directory, and `schemas/` directory. It SHALL demonstrate the entire library pipeline in a single coherent Cucumber feature.

#### Scenario: Run the full-flow example
- **WHEN** the developer runs `npm run example:full-flow` from the project root
- **THEN** Cucumber executes all scenarios in `examples/full-flow/features/` and all pass

### Requirement: Build-then-POST pipeline
The full-flow example SHALL demonstrate building a request payload from schema, POSTing it to `POST /products/add` on dummyjson.com, and asserting the echoed response.

#### Scenario: Build payload and assert POST response
- **WHEN** `buildFromSchema` produces a product payload and it is POSTed to `/products/add`
- **THEN** dummyjson echoes the payload back with a generated `id` field
- **THEN** `assertResponse` passes for the submitted fields (title, price) and the `id` is present

### Requirement: Capture response field and reuse in subsequent step
The full-flow example SHALL demonstrate capturing a field from a POST response with `{key}` and then using `<key>` as a lookup in a later step's assertion table.

#### Scenario: Captured value survives across steps
- **WHEN** a step captures `| id | {newProductId} |` from the POST response
- **THEN** `world.captures.get('newProductId')` is set
- **WHEN** a subsequent step asserts `| id | <newProductId> |` against a fetched product
- **THEN** the assertion passes because the values match

### Requirement: Array assertions on a fetched collection
The full-flow example SHALL demonstrate fetching a list endpoint (`GET /products?limit=5`) and using `[+]` and `[*]` operators to assert properties across all or some items in the response array.

#### Scenario: Assert all items in a list have required fields
- **WHEN** `GET /products?limit=5` returns an array of 5 products
- **THEN** a table row `| [+].id | /^\d+$/ |` passes (every product has a numeric id)
- **THEN** a table row `| [+].title | /\w+/ |` passes (every product has a non-empty title)

#### Scenario: Assert at least one item matches a value
- **WHEN** the product list contains at least one item with a non-zero price
- **THEN** a table row `| [*].price | /^\d/ |` passes

### Requirement: Coherent narrative across all steps
The full-flow feature file SHALL read as a single end-to-end story — not a collection of unrelated demonstrations. Steps SHALL reference each other through world state (captures/lookups) to show how a real multi-step Cucumber scenario is structured.

#### Scenario: Feature file tells a linear story
- **WHEN** reading `examples/full-flow/features/full-flow.feature`
- **THEN** each scenario or step logically follows from the previous using shared world state
