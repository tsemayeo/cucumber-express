## ADDED Requirements

### Requirement: Schema files are structurally validated before parsing
Before any schema file is parsed into definitions, the library SHALL validate every file's raw content for structural correctness. All structural errors across all files SHALL be collected and thrown together in a single error. No parsing SHALL occur if any file fails structural validation.

#### Scenario: Malformed table row is reported
- **WHEN** a schema file contains a data table row that does not have exactly two pipe-delimited columns
- **THEN** validation reports an error identifying the file name and line number of the offending row

#### Scenario: Unrecognised value prefix is reported
- **WHEN** a column-2 value starts with `(` but does not match any recognised prefix (`int`, `float`, `boolean`, `string`, `faker`, `schema`, `extends`, `array`)
- **THEN** validation reports an error identifying the file name, line number, and unrecognised prefix

#### Scenario: Empty schema name is reported
- **WHEN** a `Schema:` header has no name after the colon (or only whitespace)
- **THEN** validation reports an error identifying the file name and line number

#### Scenario: Schema block with no data table rows is reported
- **WHEN** a `Schema: Name` header is followed immediately by another `Schema:` header or end of file
- **THEN** validation reports an error identifying the file name and schema name

#### Scenario: Multiple `(extends)` rows in one schema is reported
- **WHEN** a schema definition contains more than one `(extends)` row
- **THEN** validation reports an error identifying the file name and schema name

#### Scenario: All errors across all files are reported together
- **WHEN** two schema files each contain one structural error
- **THEN** a single thrown error lists both errors and no schema definitions are registered

---

### Requirement: Schema registry is semantically validated before use
After all files are parsed into definitions, the library SHALL validate the registry for cross-file consistency. All semantic errors SHALL be collected and thrown together before any schema building begins.

#### Scenario: Duplicate schema name across files is reported
- **WHEN** two schema files each define a schema with the same name
- **THEN** validation reports an error naming the duplicate and the two files that define it

#### Scenario: Unresolvable `(schema)` reference is reported
- **WHEN** a schema row has value `(schema) Nonexistent` and no schema named `Nonexistent` is registered
- **THEN** validation reports an error naming the referencing schema, the row path, and the missing schema name

#### Scenario: Unresolvable `(extends)` reference is reported
- **WHEN** a schema has `| (extends) | Nonexistent |` and no schema named `Nonexistent` is registered
- **THEN** validation reports an error naming the extending schema and the missing base name

#### Scenario: Unresolvable `(array)` type reference is reported
- **WHEN** a schema row has value `(array) Nonexistent` and no schema named `Nonexistent` is registered
- **THEN** validation reports an error naming the referencing schema, the row path, and the missing type name

---

### Requirement: Schema files declare named schemas with data tables
A schema file SHALL contain one or more schema definitions. Each definition begins with a `Schema: <Name>` header followed by a two-column data table. The first column is a dot/index path relative to the schema root; the second column is the default value expression. Multiple schemas MAY be defined in the same file.

#### Scenario: Single schema parsed from file
- **WHEN** a file contains `Schema: User` followed by a data table with rows `| name | John |`
- **THEN** the registry contains a schema named `User` whose base object has `{ name: "John" }`

#### Scenario: Multiple schemas parsed from one file
- **WHEN** a file contains `Schema: Address` and `Schema: User` each with their own data tables
- **THEN** the registry contains both `Address` and `User` as distinct schemas

#### Scenario: Unknown schema name throws at build time
- **WHEN** `buildFromSchema` is called with a name that does not exist in the registry
- **THEN** a descriptive error is thrown naming the missing schema and the glob used to load schemas

---

### Requirement: `(faker)` prefix calls a faker method
A value of the form `(faker) <namespace>.<method>` SHALL call `faker.<namespace>.<method>()` at schema build time and use the return value. A value of the form `(faker) <namespace>.<method>(<arg>)` with a single simple argument (string or number literal) SHALL pass that argument to the method.

#### Scenario: No-arg faker call
- **WHEN** a schema row has value `(faker) person.fullName`
- **THEN** building the schema calls `faker.person.fullName()` and uses the returned string

#### Scenario: Single-arg faker call
- **WHEN** a schema row has value `(faker) lorem.words(3)`
- **THEN** building the schema calls `faker.lorem.words(3)` and uses the returned value

#### Scenario: Invalid faker path throws at parse time
- **WHEN** a schema file contains a `(faker)` value whose method path does not exist on faker
- **THEN** schema loading throws an error identifying the invalid path and the file/row

---

### Requirement: `(schema)` prefix embeds another schema
A value of the form `(schema) <Name>` SHALL resolve the named schema, build it recursively, and set the result as the value at that path.

#### Scenario: Embedded schema nested at key
- **WHEN** a `User` schema has row `| address | (schema) Address |` and `Address` has `| city | London |`
- **THEN** building `User` produces an object where `user.address.city` is `"London"`

#### Scenario: Same schema embedded at two keys
- **WHEN** a schema embeds `(schema) Address` at both `billingAddress` and `shippingAddress`
- **THEN** each key contains an independently built address object with no shared references

---

### Requirement: `(extends)` row merges a base schema
A row with path `(extends)` and value `<Name>` SHALL build the named schema and use it as the base object for the current schema. All subsequent rows in the table override fields on top of that base. There SHALL be at most one `(extends)` row per schema.

#### Scenario: Extended schema fields are inherited
- **WHEN** `AdminUser` has `| (extends) | User |` and `User` has `name` and `role`
- **THEN** building `AdminUser` produces an object with both `name` and `role` from `User`

#### Scenario: Rows after `(extends)` override inherited fields
- **WHEN** `AdminUser` has `| (extends) | User |` then `| role | admin |` and `User.role` is `"member"`
- **THEN** building `AdminUser` produces an object where `role` is `"admin"`

#### Scenario: Dot-path override reaches into embedded sub-schema
- **WHEN** a schema extends `User` (which has an embedded `Address`) and then has row `| address.country | UK |`
- **THEN** the built object has `address.country` set to `"UK"` with all other address fields preserved

---

### Requirement: Circular schema references are detected and rejected
If schema A embeds or extends schema B which (transitively) embeds or extends schema A, the library SHALL detect the cycle at build time and throw a descriptive error naming the full cycle path.

#### Scenario: Direct self-reference throws
- **WHEN** a schema contains `| (extends) | itself |`
- **THEN** building the schema throws an error identifying the cycle

#### Scenario: Transitive cycle throws
- **WHEN** schema A embeds schema B which embeds schema A
- **THEN** building either schema throws an error naming both schemas in the cycle

---

### Requirement: `(array)` prefix produces an empty array
A value of `(array)` SHALL set the field to an empty array `[]` with no declared item type. A value of `(array) <Name>` SHALL set the field to an empty typed array whose item type is the named schema. The type annotation is used during `buildFromSchema` override to auto-construct items at new indices.

#### Scenario: `(array)` without type produces empty array
- **WHEN** a schema row has value `(array)`
- **THEN** the built object has an empty array `[]` at that path

#### Scenario: `(array) Name` produces empty typed array
- **WHEN** a schema row has value `(array) CartItem`
- **THEN** the built object has an empty array at that path, annotated with item type `CartItem`

#### Scenario: Index notation pre-populates array items
- **WHEN** a schema has rows `| items[0] | (schema) CartItem |` and `| items[1] | (schema) CartItem |`
- **THEN** the built object has `items` as an array with two independently built `CartItem` objects
