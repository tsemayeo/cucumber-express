## MODIFIED Requirements

### Requirement: Validate object values via dot-path
The library SHALL export a `validateResponse(dataTable, responseObject, world?)` function. Each row SHALL be treated as a `[path, expectedValue]` pair with no header row. The function SHALL traverse the dot-separated path on `responseObject`, stringify the resolved value, and dispatch on the expected cell using the following priority order:

1. **Capture** — if expected matches `{key}` exactly: store the stringified resolved value in `world.captures` under `key`; the row produces no failure. If expected matches `{key:/regex/}`: test the stringified resolved value against the regex; if it does not match, the row fails; if it matches, store the full value or capture group 1 (if the regex contains a group) in `world.captures` under `key`.
2. **Built-in specials** — if expected is `<null>`: pass iff value is `null`. If expected is `<present>`: pass iff value is not `null` and not `undefined`.
3. **Capture lookup** — if expected matches `<key>` (any word other than `null` or `present`): retrieve `world.captures.get(key)` and compare to the stringified resolved value; throw if the key is absent or world is not provided.
4. **Regex assertion** — if expected matches `/pattern/`: test the stringified resolved value against the regex; fail the row if it does not match.
5. **Literal** — compare the stringified resolved value to the expected string exactly.

Capture rows (`{key}`, `{key:/regex/}`) require `world` to be provided; an error SHALL be thrown if world is absent. Capture lookup rows (`<key>`) require `world` to be provided; an error SHALL be thrown if world is absent or the key is not in `world.captures`. `<null>` and `<present>` are reserved and SHALL NOT be used as capture key names.

#### Scenario: Simple property match
- **WHEN** the table contains `| body.user.name | John Doe |` and `responseObject.body.user.name` equals `"John Doe"`
- **THEN** no error is thrown

#### Scenario: Simple property mismatch
- **WHEN** the table contains `| body.user.name | Jane |` and `responseObject.body.user.name` equals `"John"`
- **THEN** the function throws an error naming the path, expected value, and received value

#### Scenario: Capture stores value in world
- **WHEN** the table contains `| body.id | {userId} |` and `responseObject.body.id` equals `"abc-123"` and a world is provided
- **THEN** no error is thrown and `world.captures.get("userId")` equals `"abc-123"`

#### Scenario: Capture without world throws
- **WHEN** the table contains `| body.id | {userId} |` and no world is provided
- **THEN** the function throws an error

#### Scenario: Capture gate passes and stores value
- **WHEN** the table contains `| body.id | {userId:/^usr_/} |` and `responseObject.body.id` equals `"usr_abc"` and a world is provided
- **THEN** no error is thrown and `world.captures.get("userId")` equals `"usr_abc"`

#### Scenario: Capture gate stores group 1 when regex has a capture group
- **WHEN** the table contains `| body.id | {userId:/^usr_(\w+)/} |` and `responseObject.body.id` equals `"usr_abc123"` and a world is provided
- **THEN** no error is thrown and `world.captures.get("userId")` equals `"abc123"`

#### Scenario: Capture gate fails when value does not match regex
- **WHEN** the table contains `| body.id | {userId:/^usr_/} |` and `responseObject.body.id` equals `"org_abc"` and a world is provided
- **THEN** the row fails and `world.captures` does not contain `"userId"`

#### Scenario: Capture lookup passes when value matches captured value
- **WHEN** `world.captures.get("userId")` equals `"abc-123"` and the table contains `| body.id | <userId> |` and `responseObject.body.id` equals `"abc-123"`
- **THEN** no error is thrown

#### Scenario: Capture lookup fails when value does not match captured value
- **WHEN** `world.captures.get("userId")` equals `"abc-123"` and the table contains `| body.id | <userId> |` and `responseObject.body.id` equals `"xyz-999"`
- **THEN** the function throws a failure for that row

#### Scenario: Capture lookup throws when key not in captures
- **WHEN** the table contains `| body.id | <userId> |` and `world.captures` does not contain `"userId"`
- **THEN** the function throws an error identifying the missing key

#### Scenario: Regex assertion passes when value matches
- **WHEN** the table contains `| body.id | /^usr_/ |` and `responseObject.body.id` equals `"usr_abc"`
- **THEN** no error is thrown

#### Scenario: Regex assertion fails when value does not match
- **WHEN** the table contains `| body.id | /^usr_/ |` and `responseObject.body.id` equals `"org_abc"`
- **THEN** the function throws a failure for that row

#### Scenario: Built-in null special is not treated as capture lookup
- **WHEN** the table contains `| body.meta | <null> |` and `responseObject.body.meta` is `null` and a world is provided
- **THEN** no error is thrown and `world.captures` is not consulted

#### Scenario: Built-in present special is not treated as capture lookup
- **WHEN** the table contains `| body.name | <present> |` and `responseObject.body.name` equals `"John"` and a world is provided
- **THEN** no error is thrown and `world.captures` is not consulted

#### Scenario: No world provided, no capture or lookup rows
- **WHEN** `validateResponse` is called without a `world` argument and no expected cell uses `{key}` or `<key>` forms
- **THEN** the function behaves identically to a world-less call
