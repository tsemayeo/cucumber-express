## ADDED Requirements

### Requirement: Each operation registers a plain Cucumber step definition
For every parsed operation, the library SHALL register a Cucumber step definition using the operation's keyword (`Given`, `When`, or `Then`) and exact step phrase. When the step executes, it SHALL build the request body (if `body:` is declared), substitute path and header parameters, send the HTTP request to the service's `base` URL concatenated with the operation path, and write the parsed JSON response to `this.response`.

#### Scenario: Plain step sets this.response from HTTP response
- **WHEN** a scenario calls `When I fetch 5 products` and the operation has `method: GET` and `path: /products?limit={0}`
- **THEN** `this.response` is set to the parsed JSON body of the HTTP response

#### Scenario: Named path parameter is substituted from step string capture
- **WHEN** the step phrase is `When I get product {productId}`, the path is `/products/{productId}`, and the step is called as `When I get product "42"`
- **THEN** the HTTP request is sent to `<base>/products/42`

#### Scenario: Service-level headers are sent with every request
- **WHEN** a service declares `header Authorization: Bearer token` and any of its operations is called
- **THEN** the HTTP request includes `Authorization: Bearer token` in its headers

---

### Requirement: Every operation auto-registers a plain step and a `with:` DataTable variant
The library SHALL register two step definitions for every parsed operation — a plain variant (no DataTable) and a `with:` variant (step phrase suffixed with ` with:`) that accepts a three-column DataTable. The plain variant sends the request with no body and no query params. Both variants are registered regardless of whether the operation declares `body:`.

#### Scenario: Both variants are registered for every operation
- **WHEN** a service file is loaded with any operation
- **THEN** Cucumber has two registered steps: the plain phrase and the phrase suffixed with ` with:`

#### Scenario: Plain step sends request with no body and no query params
- **WHEN** a scenario calls `When I fetch products` with no DataTable
- **THEN** the HTTP request is sent with no body and no query string

---

### Requirement: `with:` DataTable rows are interpreted by their first column prefix
The three-column DataTable accepted by `with:` variants SHALL be interpreted row by row based on column 1. Valid prefixes are `body`, `params`, and `header`. Any other value in column 1 SHALL produce a runtime error naming the invalid prefix.

#### Scenario: `body` rows build the request body with schema defaults
- **WHEN** the operation declares `body: NewProduct` and the step is called with `| body | title | Special Widget |`
- **THEN** the request body is built from `NewProduct` schema defaults with `title` overridden to `"Special Widget"`

#### Scenario: `body` rows build the request body without a schema
- **WHEN** the operation has no `body:` declaration and the step is called with `| body | title | Widget |` and `| body | price | 9.99 |`
- **THEN** the request body is built directly from the DataTable rows as `{ title: "Widget", price: "9.99" }`

#### Scenario: `params` rows are serialised to the query string
- **WHEN** a step is called with `| params | limit | 5 |` and `| params | category | beauty |`
- **THEN** the HTTP request path includes `?limit=5&category=beauty`

#### Scenario: `params` rows treat column 3 as a raw string
- **WHEN** a step is called with `| params | limit | (int) 5 |`
- **THEN** the query string contains the literal value `(int) 5` rather than casting it to an integer

#### Scenario: `header` rows override headers for the request
- **WHEN** a step is called with `| header | X-Request-Id | abc-123 |`
- **THEN** the HTTP request includes `X-Request-Id: abc-123`, taking precedence over any service-level or operation-level header with the same key

#### Scenario: `body`, `params`, and `header` rows can appear together in one DataTable
- **WHEN** a step is called with `| body | title | Widget |`, `| params | dryRun | true |`, and `| header | X-Request-Id | abc |`
- **THEN** the request body contains `title`, the query string contains `dryRun=true`, and the request header includes `X-Request-Id: abc`

#### Scenario: Invalid column 1 prefix produces a runtime error
- **WHEN** a step is called with `| path | productId | 42 |`
- **THEN** the step throws an error naming `path` as an invalid prefix

---

### Requirement: this.request is set to the built request body before sending
When an operation sends a request body, the library SHALL set `this.request` to the built body object before sending the HTTP request. This allows subsequent assertion steps to inspect the sent body. For operations with no body, `this.request` is not modified.

#### Scenario: this.request reflects the built body
- **WHEN** `When I create product with: | title | Widget |` executes
- **THEN** `this.request` is set to the built `NewProduct` object with `title` equal to `"Widget"`

#### Scenario: this.request is unchanged for GET operations
- **WHEN** `When I fetch 5 products` executes with a prior `this.request` value
- **THEN** `this.request` retains its prior value after the step

---

### Requirement: Missing env vars referenced in service config fail at withServices() call time
If any `<env:NAME}` reference in a service file's config block or operation headers resolves to `undefined` in `process.env`, the library SHALL throw an error at `withServices()` load time, before any step definitions are registered. The error SHALL name the missing variable and the service file path.

#### Scenario: Missing env var throws at load time
- **WHEN** a service config contains `base: <env:API_BASE_URL>` and `process.env.API_BASE_URL` is undefined
- **THEN** `withServices()` throws an error naming `API_BASE_URL` and the service file

#### Scenario: Present env var resolves silently
- **WHEN** `process.env.ACCESS_TOKEN` is set to `"abc123"` and a service config contains `header Authorization: Bearer <env:ACCESS_TOKEN>`
- **THEN** `withServices()` completes without error and the header value is `Bearer abc123`
