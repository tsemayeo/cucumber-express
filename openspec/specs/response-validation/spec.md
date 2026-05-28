# Response Validation Spec

### Requirement: Validate object values via dot-path
The library SHALL export a `validateResponse(dataTable, responseObject, world?)` function. Each row in the data table SHALL be treated as a `[path, expectedValue]` pair with no header row. The function SHALL traverse the dot-separated path on `responseObject` and compare the resolved value (stringified) to the expected string. If `world` is provided and an expected cell matches the pattern `/^\{[^}]+\}$/` exactly, the value SHALL be resolved from `world.captures` before comparison; if the key is not present in `world.captures` the function SHALL throw an error identifying the missing capture key. The `world` parameter is optional; omitting it preserves existing behaviour.

#### Scenario: Simple property match
- **WHEN** the table contains `| body.user.name | John Doe |` and `responseObject.body.user.name` equals `"John Doe"`
- **THEN** no error is thrown

#### Scenario: Simple property mismatch
- **WHEN** the table contains `| body.user.name | Jane |` and `responseObject.body.user.name` equals `"John"`
- **THEN** the function throws an error naming the path, expected value, and received value

#### Scenario: Capture resolved from world
- **WHEN** the table contains `| body.id | {userId} |`, `world.captures.get("userId")` returns `"abc-123"`, and `responseObject.body.id` equals `"abc-123"`
- **THEN** no error is thrown

#### Scenario: Capture mismatch after resolution
- **WHEN** the table contains `| body.id | {userId} |`, `world.captures.get("userId")` returns `"abc-123"`, and `responseObject.body.id` equals `"xyz-999"`
- **THEN** the function throws a failure for that row

#### Scenario: Missing capture key throws
- **WHEN** the table contains `| body.id | {userId} |` and `world.captures` does not contain `"userId"`
- **THEN** the function throws an error identifying the missing capture key `"userId"`

#### Scenario: Built-in specials are not treated as captures
- **WHEN** the table contains `| body.value | <null> |` and a `world` is provided
- **THEN** `<null>` is not looked up in captures and the built-in null check is applied instead

#### Scenario: Literal values are not treated as captures
- **WHEN** the table contains `| body.name | John |` and a `world` is provided
- **THEN** `"John"` is compared literally without consulting `world.captures`

#### Scenario: No world provided, no captures in table
- **WHEN** `validateResponse` is called without a `world` argument and no expected cell matches `{key}`
- **THEN** the function behaves identically to the original two-argument call

### Requirement: Collect all failures before throwing
The function SHALL evaluate every row in the table before throwing. If multiple rows fail, the thrown error SHALL list every failing row.

#### Scenario: Multiple mismatches reported together
- **WHEN** two rows both have mismatching values
- **THEN** the thrown error message contains both failures

### Requirement: Throw on path not found
The function SHALL throw a descriptive error when a path segment cannot be resolved on the current object.

#### Scenario: Missing nested key
- **WHEN** the path is `body.user.age` and `responseObject.body.user` does not have an `age` property
- **THEN** the function throws an error identifying the unresolvable segment and the full path

### Requirement: Array index operator `[n]`
The function SHALL support `[n]` in a path to select a specific index of an array before continuing traversal.

#### Scenario: Index resolves correctly
- **WHEN** the path is `body.items[0].name` and `responseObject.body.items[0].name` equals `"Widget"`
- **THEN** no error is thrown for an expected value of `"Widget"`

#### Scenario: Index out of bounds
- **WHEN** the path is `body.items[5].name` and the array has fewer than 6 elements
- **THEN** the function throws a path-not-found error for that row

### Requirement: Array some operator `[*]`
The function SHALL support `[*]` to assert that at least one element in the array satisfies the remaining path and expected value.

#### Scenario: One matching element
- **WHEN** the path is `body.items[*].type` with expected `"sale"` and at least one item has `type: "sale"`
- **THEN** no error is thrown

#### Scenario: No matching element
- **WHEN** the path is `body.items[*].type` with expected `"sale"` and no items have `type: "sale"`
- **THEN** the function throws a failure for that row

### Requirement: Array all operator `[+]`
The function SHALL support `[+]` to assert that every element in the array satisfies the remaining path and expected value.

#### Scenario: All elements match
- **WHEN** the path is `body.items[+].available` with expected `"true"` and every item has `available: true`
- **THEN** no error is thrown

#### Scenario: One element does not match
- **WHEN** the path is `body.items[+].available` with expected `"true"` and any item has a different value
- **THEN** the function throws a failure for that row

### Requirement: Array none operator `[-]`
The function SHALL support `[-]` to assert that no element in the array satisfies the remaining path and expected value.

#### Scenario: No elements match — passes
- **WHEN** the path is `body.items[-].deleted` with expected `"true"` and no items have `deleted: true`
- **THEN** no error is thrown

#### Scenario: One element matches — fails
- **WHEN** the path is `body.items[-].deleted` with expected `"true"` and at least one item has `deleted: true`
- **THEN** the function throws a failure for that row

### Requirement: String coercion for comparison
The function SHALL coerce the resolved value to a string using `String(value)` before comparing to the expected string from the table. This applies to numbers, booleans, null, and undefined.

#### Scenario: Numeric value compared as string
- **WHEN** the path resolves to the number `200` and the expected value is `"200"`
- **THEN** no error is thrown

#### Scenario: Null value compared as string
- **WHEN** the path resolves to `null` and the expected value is `"null"`
- **THEN** no error is thrown
