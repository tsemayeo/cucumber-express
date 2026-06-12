## ADDED Requirements

### Requirement: Standalone building-and-schemas example folder
The `examples/building-and-schemas/` directory SHALL be a self-contained Cucumber project with its own `cucumber.js` config, `world.ts`, `steps/` directory, `features/` directory, and `schemas/` directory. It SHALL NOT make any HTTP calls — all data is in-memory.

#### Scenario: Run the building-and-schemas example
- **WHEN** the developer runs `npm run example:building-schemas` from the project root
- **THEN** Cucumber executes all scenarios in `examples/building-and-schemas/features/` and all pass with no network requests

### Requirement: buildRequest with type casts
The example SHALL demonstrate `buildRequest` overriding schema defaults using `(int)`, `(float)`, `(boolean)`, and bare string values in the data table.

#### Scenario: Override fields with typed values
- **WHEN** a step calls `buildRequest` with a schema defining `{ price: 0, stock: 0, active: false, name: "" }` and a table containing `(float) 29.99`, `(int) 100`, `(boolean) true`, and `Premium Widget`
- **THEN** the resulting object has the correct Go-typed values for each field

### Requirement: buildRequest with null, empty, and world lookup tokens
The example SHALL demonstrate `<null>`, `<empty>`, and `<key>` world lookup tokens inside a `buildRequest` table.

#### Scenario: Set a field to null
- **WHEN** a table row contains `<null>`
- **THEN** the resulting field is `null`

#### Scenario: Set an array field to empty
- **WHEN** a table row contains `<empty>`
- **THEN** the resulting field is `[]`

#### Scenario: Inject a captured value via lookup
- **WHEN** `world.captures` contains `{ orderId: "ORD-999" }` and a table row contains `<orderId>`
- **THEN** the resulting field equals `"ORD-999"`

### Requirement: Schema definitions file
The example SHALL include a `schemas/models.feature` file defining at least three schemas: a base type, a type that extends it, and a type with sub-schemas and a typed array.

#### Scenario: Schema file is valid and loads without error
- **WHEN** `ScenarioWorld.withSchemas('examples/building-and-schemas/schemas/**/*.feature')` is called
- **THEN** all schemas are registered without error and accessible via `world.schemas`

### Requirement: buildFromSchema with defaults
The example SHALL demonstrate calling `buildFromSchema` with an empty table, producing an object whose shape is entirely determined by the schema (including faker-generated values and nested sub-schemas).

#### Scenario: Build from schema with no overrides
- **WHEN** `buildFromSchema('Product', emptyTable, world)` is called
- **THEN** the result has all fields defined in the Product schema, with faker values for faker-typed fields

### Requirement: buildFromSchema with table overrides including array resize
The example SHALL demonstrate overriding specific fields via data table, including using `(array:N)` to resize a typed array field.

#### Scenario: Override a specific field value
- **WHEN** `buildFromSchema('Order', table, world)` is called with a table row setting `status` to `shipped`
- **THEN** the result has `status: "shipped"` and all other fields from the schema

#### Scenario: Resize a typed array with (array:N)
- **WHEN** a table row contains `| items | (array:3) |` for a schema where `items` is a typed array
- **THEN** the result has exactly 3 items, each built from the item schema defaults
