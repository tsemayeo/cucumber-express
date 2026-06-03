## MODIFIED Requirements

### Requirement: World lookup in value column
When a `ScenarioWorld` is provided, the value column SHALL support `<key>` to look up a captured value from `world.captures`. The reserved tokens `<null>` and `<empty>` SHALL NOT be treated as lookups. The resolved string MAY be combined with a type cast prefix, but cast prefixes SHALL NOT be combined with reserved tokens.

#### Scenario: Lookup sets field from captured value
- **WHEN** the value is `<userId>` and `world.captures.get('userId')` is `'abc-123'`
- **THEN** the field is set to the string `'abc-123'`

#### Scenario: Lookup combined with type cast
- **WHEN** the value is `(int)<count>` and `world.captures.get('count')` is `'5'`
- **THEN** the field is set to the number `5`

#### Scenario: Lookup throws when key not in captures
- **WHEN** the value is `<missing>` and `world.captures` has no entry for `'missing'`
- **THEN** `buildRequest` throws an error referencing the missing key

#### Scenario: Lookup throws when no world provided
- **WHEN** the value is `<key>` and no world argument is passed
- **THEN** `buildRequest` throws an error

#### Scenario: `<null>` does not trigger a lookup
- **WHEN** the value is `<null>` and no world is provided
- **THEN** `buildRequest` does not throw and sets the field to `null`

#### Scenario: `<empty>` does not trigger a lookup
- **WHEN** the value is `<empty>` and no world is provided
- **THEN** `buildRequest` does not throw and sets the field to `[]`

## ADDED Requirements

### Requirement: Reserved token `<null>` sets field to null
`buildRequest` SHALL treat the value `<null>` as the literal value `null`, setting the target field to `null` regardless of whether a world is provided.

#### Scenario: Set a field to null
- **WHEN** a table row has value `<null>`
- **THEN** the field at the specified path is set to `null`

#### Scenario: `<null>` works without a world
- **WHEN** the value is `<null>` and `buildRequest` is called with no world argument
- **THEN** the field is set to `null` without error

### Requirement: Reserved token `<empty>` sets field to an empty array
`buildRequest` SHALL treat the value `<empty>` as an empty array `[]`, setting the target field to a fresh empty array regardless of whether a world is provided.

#### Scenario: Set a field to an empty array
- **WHEN** a table row has value `<empty>`
- **THEN** the field at the specified path is set to `[]`

#### Scenario: `<empty>` works without a world
- **WHEN** the value is `<empty>` and `buildRequest` is called with no world argument
- **THEN** the field is set to `[]` without error
