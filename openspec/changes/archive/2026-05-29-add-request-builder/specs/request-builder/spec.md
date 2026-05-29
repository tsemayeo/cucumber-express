## ADDED Requirements

### Requirement: Schema factory produces the base object
`buildRequest` SHALL call the user-supplied schema factory once per invocation to produce the base object. All table overrides are applied on top of this base.

#### Scenario: Schema is called on each invocation
- **WHEN** `buildRequest` is called with a schema factory
- **THEN** the factory is called exactly once and its return value is used as the base object

#### Scenario: Schema output is not mutated across calls
- **WHEN** `buildRequest` is called twice with the same schema factory
- **THEN** the two calls produce independent objects with no shared references

---

### Requirement: Table rows deep-set values by path
`buildRequest` SHALL traverse the base object using each row's path and set the value at the resolved leaf, creating intermediate objects and arrays as needed. Sibling fields at any level SHALL be preserved.

#### Scenario: Override an existing leaf field
- **WHEN** a table row specifies a path that exists in the schema output
- **THEN** the value at that path is replaced with the table value and all sibling fields are unchanged

#### Scenario: Create a new leaf field not in schema
- **WHEN** a table row specifies a path whose leaf key does not exist in the schema output
- **THEN** the key is created on the parent object with the table value

#### Scenario: Create intermediate objects for missing path segments
- **WHEN** a table row specifies a path whose intermediate key does not exist in the schema output
- **THEN** intermediate objects are created as needed and the leaf is set

---

### Requirement: Array element must exist to be overridden
`buildRequest` SHALL only allow setting fields on array elements that already exist in the base object. If a table row targets an index that is out of bounds, `buildRequest` SHALL throw a descriptive error. Elements that do exist SHALL have only the specified field changed; all other fields on the element SHALL be preserved.

#### Scenario: Preserve existing element fields on override
- **WHEN** a table row targets `items[0].name` and `items[0]` already has other fields from the schema
- **THEN** only `name` is changed; all other fields on `items[0]` are preserved

#### Scenario: Throws when element at index does not exist
- **WHEN** a table row targets `items[2].name` and `items` has fewer than 3 elements
- **THEN** `buildRequest` throws an error referencing the out-of-bounds index

---

### Requirement: Type casting via value prefix
The value column SHALL support `(int)`, `(float)`, and `(boolean)` prefixes to cast the string value before setting it. Without a prefix the value is set as a string.

#### Scenario: Cast to int
- **WHEN** the value is `(int)30`
- **THEN** the field is set to the number `30`

#### Scenario: Cast to float
- **WHEN** the value is `(float)9.99`
- **THEN** the field is set to the number `9.99`

#### Scenario: Cast to boolean — true
- **WHEN** the value is `(boolean)true`
- **THEN** the field is set to the boolean `true`

#### Scenario: Cast to boolean — false
- **WHEN** the value is `(boolean)false`
- **THEN** the field is set to the boolean `false`

#### Scenario: No prefix defaults to string
- **WHEN** the value has no type prefix
- **THEN** the field is set as a string

---

### Requirement: World lookup in value column
When a `ScenarioWorld` is provided, the value column SHALL support `<key>` to look up a captured value from `world.captures`. The resolved string MAY be combined with a type cast prefix.

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

---

### Requirement: Conflicting path traversal throws
`buildRequest` SHALL throw a descriptive error when a path segment cannot be traversed because the value at that position is the wrong type.

#### Scenario: Non-object in key path
- **WHEN** a table row targets `body.user.name` and `body.user` is a string (not an object)
- **THEN** `buildRequest` throws an error describing the conflict

#### Scenario: Non-array for index segment
- **WHEN** a table row targets `body.items[0].name` and `body.items` is a string (not an array)
- **THEN** `buildRequest` throws an error describing the conflict

#### Scenario: Collection operator in path
- **WHEN** a table row path contains `[*]`, `[+]`, or `[-]`
- **THEN** `buildRequest` throws an error stating collection operators are not supported for writing
