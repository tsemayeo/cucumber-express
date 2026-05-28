## MODIFIED Requirements

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
