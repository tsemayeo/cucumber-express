# Build From Schema Spec

### Requirement: `buildFromSchema` resolves a named schema and builds the base object
`buildFromSchema(name, dataTable, world)` SHALL look up the named schema in `world.schemas`, build the base object by evaluating all faker calls, embedding sub-schemas, and applying extension, then apply data table overrides using the same path and value parsing as `buildRequest`. The function SHALL return the fully built object.

#### Scenario: Base object is built from schema defaults
- **WHEN** `buildFromSchema("User", emptyTable, world)` is called and `User` has `| role | member |`
- **THEN** the returned object has `role` set to `"member"`

#### Scenario: Table overrides are applied on top of base
- **WHEN** `buildFromSchema("User", tableWith({ "role": "admin" }), world)` is called
- **THEN** the returned object has `role` set to `"admin"` and all other schema defaults preserved

#### Scenario: Faker fields are freshly generated on each call
- **WHEN** `buildFromSchema("User", emptyTable, world)` is called twice
- **THEN** faker-generated fields MAY differ between calls (each call is a fresh evaluation)

#### Scenario: Throws when schema name not found
- **WHEN** `buildFromSchema("Nonexistent", emptyTable, world)` is called
- **THEN** a descriptive error is thrown naming the missing schema

#### Scenario: Throws when world is not provided
- **WHEN** `buildFromSchema("User", dataTable)` is called without a world argument
- **THEN** an error is thrown stating that a world with a schema registry is required

---

### Requirement: Data table overrides support the same value syntax as `buildRequest`
The value column in the data table passed to `buildFromSchema` SHALL support all existing `buildRequest` value forms: plain strings, `(int)`, `(float)`, `(boolean)` type prefixes, and `<key>` world capture lookups.

#### Scenario: Type prefix cast in override
- **WHEN** a data table row has value `(int) 5` for a numeric field
- **THEN** the field is set to the integer `5`

#### Scenario: World capture lookup in override
- **WHEN** a data table row has value `<userId>` and `world.captures.get("userId")` is `"abc-123"`
- **THEN** the field is set to the string `"abc-123"`

---

### Requirement: Typed array auto-construction on out-of-bounds override
When a data table override targets an index that does not yet exist on a typed array (declared with `(array) <Name>` in the schema), `buildFromSchema` SHALL build a new instance of the named item schema and append it before applying the field override. The auto-constructed item SHALL have all its schema defaults populated.

#### Scenario: Auto-construct item at new index
- **WHEN** a schema has `| items | (array) CartItem |` and a table row overrides `items[0].name`
- **THEN** a `CartItem` is built at `items[0]` with its defaults, then `.name` is overridden

#### Scenario: Auto-construction preserves other item defaults
- **WHEN** `CartItem` has `| qty | (int) 1 |` and an override sets `items[0].name`
- **THEN** `items[0].qty` is `1` (from CartItem defaults) and `items[0].name` is the overridden value

#### Scenario: Untyped array does not auto-construct
- **WHEN** a schema has `| tags | (array) |` (no type) and a table row overrides `tags[0]`
- **THEN** an error is thrown stating the index is out of bounds (consistent with `buildRequest` behaviour)

---

### Requirement: `(array:N)` in override table declares array population count
`buildFromSchema` SHALL support `(array:N)` as a value in the override data table, where the path targets an array field and N is a non-negative integer. The field SHALL be replaced with exactly N freshly built instances of the item schema declared on that field, each with full schema defaults populated. Schema-defaulted items at that path are discarded and replaced. Index overrides on the same field in the same table are applied on top after population.

#### Scenario: `(array:N)` populates N items with schema defaults
- **WHEN** a schema has `| items | (array) CartItem |` and a table row has `| items | (array:3) |`
- **THEN** the returned object has `items` as an array of 3 independently built `CartItem` objects with their defaults

#### Scenario: `(array:N)` replaces schema-defaulted items
- **WHEN** the schema pre-populates `items[0]` and `items[1]` via `(array:2) CartItem` and a table row has `| items | (array:1) |`
- **THEN** the returned object has `items` as an array of exactly 1 freshly built item

#### Scenario: Index overrides apply on top of `(array:N)` population
- **WHEN** a table has `| items | (array:3) |` and `| items[0].name | Special |`
- **THEN** `items[0].name` is `"Special"` and all other fields on `items[0]` and the remaining items retain their `CartItem` defaults

#### Scenario: `(array:0)` produces an empty array
- **WHEN** a table row has `| items | (array:0) |` for a typed array field
- **THEN** the field is set to `[]`

#### Scenario: `(array:0)` on an untyped array produces an empty array
- **WHEN** a schema has `| tags | (array) |` and a table row has `| tags | (array:0) |`
- **THEN** the field is set to `[]`

#### Scenario: `(array:N)` on an untyped array throws when N is greater than zero
- **WHEN** a schema has `| tags | (array) |` and a table row has `| tags | (array:2) |`
- **THEN** an error is thrown stating that `(array:N)` requires a typed array when N is greater than zero

#### Scenario: `(array:N)` on a non-array field throws
- **WHEN** a table row has `| name | (array:3) |` and `name` is not an array field in the schema
- **THEN** an error is thrown stating that `(array:N)` is only valid for array fields
