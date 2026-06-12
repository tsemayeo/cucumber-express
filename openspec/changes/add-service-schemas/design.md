## Context

The library currently provides `buildFromSchema` and `assertResponse` as the two pillars of test data management. HTTP calls are left entirely to the user — they write TypeScript step definitions that manually call `fetch`, set `this.request`/`this.response`, and handle path/body interpolation themselves. Every project using this library duplicates this pattern.

The schema system already has a custom line-by-line parser for `.feature` files (not Cucumber's built-in parser). Service files will use the same approach — a custom parser reads service declarations and the library registers Cucumber step definitions programmatically via `Given`/`When`/`Then` from `@cucumber/cucumber`.

## Goals / Non-Goals

**Goals:**
- A Gherkin-like file format users can write to declare a service and its operations
- Each declared operation automatically becomes a registered Cucumber step definition
- Every operation gets a plain variant and a three-column DataTable `with:` variant
- `<env:NAME>` interpolation in both service config and schema table values
- `ScenarioWorld.withServices(glob)` loads service files and wires up steps
- Fail fast on missing env vars at load time, not mid-test

**Non-Goals:**
- Non-HTTP drivers (DynamoDB, SQS) — HTTP only for this change; the format is designed to be driver-extensible but no other drivers are implemented
- Response schema validation — `body:` and `params:` are for building requests only
- Authentication flows (OAuth, token refresh) — static env var injection only
- Step definition conflict detection across services — Cucumber's own duplicate step error is sufficient

## Decisions

### Decision 1: Grammar C — step phrase IS the operation name

**Choice:** Operations are declared with the full Cucumber step phrase (`When I create product`) rather than a derived name (`Operation: create product`).

**Rationale:** The step phrase is the user-facing contract. Making it explicit in the service file removes a naming-derivation step and means users can read the service file to know exactly what to type in a scenario. The phrase IS the API.

**Alternative considered:** `Operation: create product` with auto-derived step phrase (`When I create product using ProductsApi`). Rejected because the derived phrase adds a service name suffix to every scenario step, and the mapping from operation name to step phrase introduces an implicit convention to learn.

### Decision 2: `@driver` tag + `Service: Name` keyword — consistent with Gherkin and schema conventions

**Choice:**
```
@http
Service: ProductsApi
  base: https://dummyjson.com
  header Authorization: Bearer <env:ACCESS_TOKEN>
```

**Rationale:** `Service: Name` mirrors the existing `Schema: Name` pattern — same capitalisation, same colon, same visual grammar. The `@http` tag sits above the keyword exactly as Gherkin tags sit above `Feature:` and `Scenario:`, making the driver type immediately scannable without introducing new punctuation. Config key-values below are uniform with operation config. Operations start with `When`/`Given`/`Then` which are visually distinct — no additional separator keyword needed.

**Alternative considered:** Inline driver annotation (`service ProductsApi (http)`). Rejected in favour of the `@tag` convention because it deviates from Gherkin's established tag placement and introduces a distinct parenthesis syntax not used elsewhere in the grammar.

### Decision 3: Universal `with:` variant + three-column DataTable

**Choice:** Every operation registers both a plain step and a `with:` variant — regardless of whether `body:` is declared. The `with:` variant accepts a three-column DataTable:
- Column 1: `body`, `params`, or `header` (destination prefix)
- Column 2: key
- Column 3: `(type) value`

`body` rows build the request object. If the operation declares `body: Schema`, the schema provides defaults and DataTable rows are applied as overrides via `buildFromSchema`. If no `body:` schema is declared, the object is built directly from the `body` rows alone. `params` rows are serialised to the query string as raw strings; type cast prefixes are not processed. `header` rows override or add per-request headers, taking precedence over service-level and operation-level headers.

**Rationale:** The three-column format makes every table self-describing — the destination is explicit in the data, not inferred from the HTTP method. This allows any method to carry body fields, query params, and header overrides in a single step. Making `body:` optional means operations that don't need schema defaults don't require a schema to be declared.

**Alternative considered:** Inferring destination from the HTTP method (GET → params, POST → body). Rejected because it prevents POST operations from having query params, requires users to know the inference rule, and adds invisible semantics to the table.

### Decision 4: `<env:NAME>` everywhere — schema values and service config

**Choice:** A single interpolation token `<env:NAME>` works in both schema table value cells and service config lines.

**Rationale:** One token to learn. It fits the existing `<...>` read-side convention alongside `<null>`, `<empty>`, `<present>`, and capture lookups `<key>` — angle brackets mean "read from somewhere", curly braces mean "write a capture". In service config, it interpolates inline within string values (`Bearer <env:TOKEN>`). In schema table cells, `<env:NAME>` aligns with the read/lookup semantics already established by the `<...>` family.

**Alternative considered:** `(env) NAME` to be consistent with schema token patterns (`(faker)`, `(schema)`, etc.). Rejected because it cannot embed mid-string in service config headers/URLs, forcing a different token per context.

### Decision 5: `assertResponse` adopts three-column format — breaking change

**Choice:** `assertResponse` moves from two-column (`path | expected`) to three-column (`body | path | expected` or `header | header-name | expected`). `body` rows assert on the response body exactly as the two-column format did. `header` rows assert on response headers stored in `this.responseHeaders` on the world. `ScenarioWorld` gains a `responseHeaders` property (`Record<string, string>`) set by service steps after each request.

**Rationale:** Consistent with the request DataTable model where column 1 is always the destination/source prefix. Since the library has no production users, there is no migration cost. Two formats (old two-column and new three-column) would add parser complexity and a permanent cognitive burden.

**Alternative considered:** Backwards-compatible support for both two and three column formats. Rejected — no production users means no migration cost, and a single format is simpler to implement, document, and learn.

### Decision 6: `withServices()` as a chainable static method on ScenarioWorld

**Choice:**
```typescript
const World = await ScenarioWorld
  .withSchemas('schemas/**/*.feature')
  .withServices('services/**/*.feature')
```

**Rationale:** Mirrors the existing `withSchemas` API exactly. Chaining keeps world setup in one expression. `withServices` registers Cucumber steps as a side effect (via `When`/`Given`/`Then`) and returns the same configured class.

**Alternative considered:** A separate `loadServices(glob)` function called outside of world setup. Rejected because it splits setup across two call sites and loses the symmetry with `withSchemas`.

### Decision 6: Service files use `.feature` extension

**Choice:** Service definition files use the `.feature` extension in a `services/` directory.

**Rationale:** Editor syntax highlighting works out of the box. The custom parser already reads `.feature` files for schemas — the same glob mechanism applies. Service files are declarative in the Gherkin spirit even if they're not runnable Cucumber features.

**Alternative considered:** A custom `.service` extension. Clearer intent but no syntax highlighting, requires tooling configuration, and adds a new concept for users to adopt.

## Risks / Trade-offs

- **Cucumber global step registry** → If two service files declare the same step phrase, Cucumber throws a duplicate step error. Mitigation: document that step phrases must be unique across all service files; the error message from Cucumber is actionable.
- **`fetch` availability** → The step registrar uses native `fetch`. Node 18+ ships it; older Node versions require a polyfill. Mitigation: document the Node ≥18 requirement (already implied by the project's `.node-version`).
- **Env var fail-fast timing** → `withServices()` is async (reads files). Missing env vars are detected at this point — before any scenario runs. If the user calls `withServices()` in a lazy/deferred way, detection may be later than expected. Mitigation: document that `withServices()` should be called in world setup, not lazily.
- **HTTP only for now** → `@http` is the only implemented driver tag. The format supports future drivers via additional `@tag` values but nothing else is wired. Mitigation: the parser can reject unknown driver tags with a clear error.

## Open Questions

- Should `this.request` still be set by service steps (for post-hoc inspection in assertions), or is `this.response` the only world mutation?
- For `params:` schema operations, should query params from the schema merge with any inline path params (`?fixed=1&dynamic={0}`), or should inline and schema params be mutually exclusive?
