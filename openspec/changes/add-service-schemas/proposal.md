## Why

Users currently write TypeScript step definitions by hand for every HTTP or DynamoDB operation — boilerplate that duplicates the same fetch/client pattern across projects. There's no declarative way to define a service's operations alongside schemas, so the "what to send" and "how to send it" live in different places and different languages.

## What Changes

- A new Gherkin-like file format for declaring services and their operations — using `When`/`Given`/`Then` phrases as operation names so each operation directly maps to a Cucumber step
- A `withServices(glob)` API on `ScenarioWorld` that loads service files and auto-registers Cucumber step definitions — no hand-written TypeScript fetch code needed
- Every operation automatically gets two step registrations: one plain and one accepting an inline three-column DataTable — column 1 is `body`, `params`, or `header`; column 2 is the key; column 3 is the `(type) value`. `body` rows build the request object (using the operation's declared schema for defaults if present, otherwise from the DataTable alone); `params` rows serialise to the query string; `header` rows override or add per-request headers
- `assertResponse` moves to a three-column DataTable format — column 1 is `body` or `header`, column 2 is the path or header name, column 3 is the expected value. **BREAKING** — the existing two-column format is removed
- A new `<env:NAME>` interpolation token for reading environment variables — available in both schema value cells and service config lines

## Capabilities

### New Capabilities

- `service-schema-format`: The Gherkin file grammar for declaring services — `@driver` tag above a `Service: Name` block with config key-values, and `When`/`Given`/`Then` operation blocks each containing an HTTP method + path and optional `body:` and `header:` declarations
- `service-step-generation`: Loading service files via a glob, parsing their operations, and auto-registering Cucumber step definitions that build request bodies from schemas, interpolate path and query parameters, send the HTTP request, and write the response to `this.response`
- `env-interpolation`: The `<env:NAME>` token — resolves to `process.env.NAME` at runtime, usable in schema table value cells and in service config lines; missing variables fail fast at load time

### Modified Capabilities

- `scenario-world`: Add `ScenarioWorld.withServices(glob)` as a chainable static method alongside `withSchemas`, returning a configured class with service step definitions registered into Cucumber; add `responseHeaders` property to hold HTTP response headers set by service steps
- `response-validation`: **BREAKING** — `assertResponse` moves from two-column to three-column DataTable format, adding `body` and `header` prefixes in column 1 and enabling response header assertions

## Impact

- New source files: `src/service/` (parser, loader, step-registrar, types)
- Existing: `src/world/index.ts` extended with `withServices()` chaining
- Existing: `src/schema/parse.ts` / `src/schema/types.ts` extended to support `<env:NAME>` token
- No breaking changes to existing schema or assertion APIs
- New dev dependency: none (uses native `fetch`, existing Cucumber APIs)
