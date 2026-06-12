## ADDED Requirements

### Requirement: Standalone assertions example folder
The `examples/assertions/` directory SHALL be a self-contained Cucumber project with its own `cucumber.js` config, `world.ts`, `steps/` directory, and `features/` directory. It SHALL NOT share files with other example folders.

#### Scenario: Run the assertions example
- **WHEN** the developer runs `npm run example:assertions` from the project root
- **THEN** Cucumber executes all scenarios in `examples/assertions/features/` and all pass

### Requirement: Literal and typed value assertions
The assertions example SHALL demonstrate asserting response fields using bare string literals and type-cast prefixes (`(int)`, `(float)`, `(boolean)`).

#### Scenario: Assert a literal string field
- **WHEN** the response contains `{ title: "Essence Mascara Lash Princess" }`
- **THEN** a table row `| title | Essence Mascara Lash Princess |` passes without error

#### Scenario: Assert a typed numeric field
- **WHEN** the response contains `{ id: 1, stock: 5, price: 9.99 }`
- **THEN** table rows `| id | (int) 1 |`, `| stock | (int) 5 |`, and `| price | (float) 9.99 |` all pass

### Requirement: Regex assertions
The assertions example SHALL demonstrate asserting response fields using `/pattern/` regex syntax.

#### Scenario: Assert a field matches a regex pattern
- **WHEN** the response contains `{ sku: "RCH45Q1A", thumbnail: "https://cdn.dummyjson.com/..." }`
- **THEN** table rows `| sku | /^[A-Z0-9]+$/ |` and `| thumbnail | /^https?:\/\// |` pass

### Requirement: Nested path assertions
The assertions example SHALL demonstrate asserting fields on nested objects using dot-notation paths.

#### Scenario: Assert a deeply nested field
- **WHEN** the response contains `{ meta: { barcode: "9164035109868", createdAt: "2024-05-23T..." } }`
- **THEN** table rows `| meta.barcode | /^\d+$/ |` and `| meta.createdAt | /^\d{4}-\d{2}-\d{2}/ |` pass

### Requirement: Captures and cross-step lookups
The assertions example SHALL demonstrate capturing a field value with `{key}` and reusing it later in the same scenario with `<key>`.

#### Scenario: Capture and look up a value within one scenario
- **WHEN** a step asserts `| id | {productId} |` against a response with `{ id: 1 }`
- **THEN** `world.captures.get('productId')` equals `"1"`
- **WHEN** a subsequent step asserts `| id | <productId> |` against a response with `{ id: 1 }`
- **THEN** the assertion passes

### Requirement: Array operator assertions
The assertions example SHALL demonstrate the `[*]` (some), `[+]` (all), and `[-]` (none) array operators against a multi-item response array.

#### Scenario: Assert all elements satisfy a condition
- **WHEN** the response is an array of products all with `category: "beauty"`
- **THEN** a table row `| [+].category | beauty |` passes

#### Scenario: Assert at least one element satisfies a condition
- **WHEN** the response array contains at least one product with `stock` greater than zero
- **THEN** a table row using `[*]` on a known field passes

#### Scenario: Assert no element satisfies a condition
- **WHEN** the response array contains no products with a specific impossible value
- **THEN** a table row using `[-]` on that value passes
