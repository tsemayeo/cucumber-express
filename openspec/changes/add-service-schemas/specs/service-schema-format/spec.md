## ADDED Requirements

### Requirement: Service files declare named services with a driver tag and config block
A service file SHALL contain one or more service declarations. Each declaration begins with a `@<driver>` tag line immediately followed by a `Service: <Name>` line, then zero or more indented `key: value` config lines. The `@<driver>` tag and `Service:` line SHALL be adjacent with no blank line between them. The only supported driver tag for this change is `@http`. An unknown driver tag SHALL produce a validation error at load time.

#### Scenario: Service declaration parsed with driver tag and base config
- **WHEN** a service file contains `@http` followed by `Service: ProductsApi` followed by `  base: https://example.com`
- **THEN** the parsed service has name `ProductsApi`, driver `http`, and config `base` set to `https://example.com`

#### Scenario: Unknown driver tag is rejected at load time
- **WHEN** a service file contains `@grpc` above `Service: MyService`
- **THEN** loading throws an error identifying the service name and unsupported driver `grpc`

#### Scenario: Service-level headers are parsed from config block
- **WHEN** a service config block contains `  header Authorization: Bearer token`
- **THEN** the parsed service has a header entry `Authorization: Bearer token` applied to all operations

---

### Requirement: Operations are declared as Cucumber step phrases within a service
An operation block SHALL begin with a line starting with `When `, `Given `, or `Then ` (case-sensitive) at one level of indentation inside the service block. The remainder of that line is the exact Cucumber step phrase — including any Cucumber expression parameters such as `{int}`, `{string}`, or `{word}`. The operation block ends when the next operation or service declaration begins, or at end of file.

#### Scenario: Operation step phrase is parsed exactly
- **WHEN** a service contains the operation line `  When I fetch {int} products`
- **THEN** the parsed operation has step phrase `I fetch {int} products` and step keyword `When`

#### Scenario: Multiple operations parsed from one service
- **WHEN** a service block contains two `When` operation lines
- **THEN** two operations are parsed, each with their own step phrase and config

#### Scenario: Given and Then keywords are accepted
- **WHEN** an operation is declared with `  Given a product exists` or `  Then the product is created`
- **THEN** the operation is parsed with keyword `Given` or `Then` respectively

---

### Requirement: Operations declare HTTP method and path as separate key-value lines
An operation block SHALL contain a `method: <METHOD>` line and a `path: <path>` line. Supported method values are `GET`, `POST`, `PUT`, `PATCH`, `DELETE`. The path MAY contain named parameter references of the form `{name}`, where `name` matches a parameter name used in the step phrase. At step registration time, each `{name}` in the step phrase is rewritten to `{string}` for Cucumber, and the library tracks the name-to-position mapping for path substitution at execution time. Both `method:` and `path:` are required; omitting either SHALL produce a validation error at load time.

#### Scenario: Method and path parsed from separate key-value lines
- **WHEN** an operation block contains `    method: POST` and `    path: /products/add`
- **THEN** the parsed operation has method `POST` and path `/products/add`

#### Scenario: Named parameter in path matches step phrase parameter name
- **WHEN** the step phrase is `When I get product {productId}` and the path is `    path: /products/{productId}`
- **THEN** the parsed operation records that `{productId}` in the path corresponds to the first `{string}` capture in the registered Cucumber step

#### Scenario: Unsupported method value is rejected at load time
- **WHEN** an operation block contains `    method: CONNECT`
- **THEN** loading throws an error identifying the operation and unsupported method `CONNECT`

#### Scenario: Missing method line is reported
- **WHEN** an operation block contains `    path: /products` but no `method:` line
- **THEN** loading reports an error identifying the service name, step phrase, and missing `method`

#### Scenario: Missing path line is reported
- **WHEN** an operation block contains `    method: GET` but no `path:` line
- **THEN** loading reports an error identifying the service name, step phrase, and missing `path`

---

### Requirement: Operations optionally declare a body schema
An operation block MAY contain a `body: <SchemaName>` line referencing a named schema in the registry. When present, the schema provides default field values for `body` rows supplied in the `with:` DataTable at scenario time. `body:` is optional — if omitted, `body` rows in the DataTable are used to build the request object directly with no defaults. An unresolvable schema name SHALL produce a validation error at load time.

#### Scenario: Body schema name is parsed
- **WHEN** an operation block contains `    body: NewProduct`
- **THEN** the parsed operation has `bodySchema` set to `NewProduct`

#### Scenario: Operation with no body schema is valid
- **WHEN** an operation block contains only `method:`, `path:`, and `header:` lines with no `body:` line
- **THEN** the operation is parsed successfully with `bodySchema` set to `undefined`

---

### Requirement: Operations optionally declare operation-level headers
An operation block MAY contain one or more `header Key: Value` lines. These headers are merged with service-level headers at step execution time, with operation-level values taking precedence for duplicate keys.

#### Scenario: Operation-level header is parsed
- **WHEN** an operation block contains `    header Idempotency-Key: {0}`
- **THEN** the parsed operation has a header entry `Idempotency-Key: {0}`

#### Scenario: Operation header overrides service header for same key
- **WHEN** a service declares `  header X-Version: 1` and an operation declares `    header X-Version: 2`
- **THEN** the merged headers for that operation contain `X-Version: 2`

---

### Requirement: Service files are structurally validated at load time
All structural errors in a service file SHALL be collected and reported together before any step definitions are registered. A file with structural errors SHALL register no steps.

#### Scenario: Missing base URL is reported
- **WHEN** an `http` service has no `base:` config line
- **THEN** loading reports an error identifying the service name and missing `base` config

#### Scenario: Operation with no method/path line is reported
- **WHEN** an operation block contains only `body: SomeSchema` with no HTTP method line
- **THEN** loading reports an error identifying the service name, step phrase, and missing method/path
