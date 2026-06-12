## 1. Env Interpolation

- [x] 1.1 Add `<env:NAME>` token type to `SchemaValueToken` in `src/schema/types.ts`
- [x] 1.2 Update `src/schema/parse.ts` to recognise and parse `<env:NAME>` tokens in schema value cells
- [x] 1.3 Update `src/schema/validate.ts` to collect missing env var errors at validation time and throw them together
- [x] 1.4 Update `src/build/parsevalue.ts` to resolve `<env:NAME>` tokens to `process.env.NAME` at build time
- [x] 1.5 Add unit tests for env interpolation in schemas: standalone token, missing var error, multiple missing vars reported together

## 2. Service Parser

- [ ] 2.1 Create `src/service/types.ts` with `ServiceDefinition`, `OperationDefinition`, and related types
- [ ] 2.2 Create `src/service/parse.ts` with a line-by-line parser that reads `@driver` tag + `Service: Name` blocks with config key-values, and `When`/`Given`/`Then` operation blocks with `method:`, `path:`, `body:`, and `header:` key-value lines — recording named `{name}` path parameters and their position mapping for step registration
- [ ] 2.3 Create `src/service/validate.ts` to validate parsed services: unknown driver, missing `base:`, body on GET, unresolvable schema names, missing env vars — collecting all errors before throwing
- [ ] 2.4 Create `src/service/load.ts` with `loadServices(glob)` that reads matching files, parses them, resolves `<env:NAME>` in config and operation headers, validates, and returns a `ServiceRegistry`
- [ ] 2.5 Add unit tests for the service parser: single service with one operation, multiple operations, service-level headers, operation-level headers, named path params and their name-to-position mapping, body schema declaration
- [ ] 2.6 Add unit tests for service validation: unknown driver error, missing base URL error, body on GET error, missing env var error, all errors reported together

## 3. assertResponse Three-Column Format

- [ ] 3.1 Add `responseHeaders` property (`Record<string, string>`) to `ScenarioWorld` in `src/world/index.ts`, initialised as `{}`
- [ ] 3.2 Update `src/assert/index.ts` (`assertResponse`) to expect three-column DataTable rows — reject two-column rows with a descriptive error
- [ ] 3.3 Implement `body` prefix handling in `assertResponse`: strip prefix column, evaluate path and expected value using existing dispatch logic
- [ ] 3.4 Implement `header` prefix handling in `assertResponse`: look up header by name (case-insensitive) from `world.responseHeaders`, evaluate expected value using same dispatch logic
- [ ] 3.5 Throw on unknown column 1 prefix with a descriptive error naming the invalid prefix
- [ ] 3.6 Add unit tests for `assertResponse`: `body` row matches, `header` row matches, `header` case-insensitive lookup, `header` row missing header fails, mixed `body`+`header` rows collect all failures, invalid prefix throws

## 4. Service Step Registrar

- [ ] 4.1 Create `src/service/register.ts` that takes a `ServiceRegistry` and calls Cucumber's `Given`/`When`/`Then` to register step definitions for each operation
- [ ] 4.2 Implement plain step registration: send HTTP request with no body and no query params, set `this.request`, `this.response`, and `this.responseHeaders`
- [ ] 4.3 Implement universal `with:` variant registration for every operation — accepts three-column DataTable, splits rows by column 1 prefix
- [ ] 4.4 Implement `body` row handling: if operation has `body:` schema, pass rows to `buildFromSchema` as overrides; if no schema, build object directly from DataTable rows
- [ ] 4.5 Implement `params` row handling: serialise column 2/3 pairs as raw strings to the query string appended to the path; type cast prefixes in column 3 are not processed
- [ ] 4.6 Implement `header` row handling for requests: merge DataTable header rows with service-level and operation-level headers, with DataTable rows taking highest precedence
- [ ] 4.7 Reject unknown column 1 prefixes at runtime with a descriptive error naming the invalid prefix
- [ ] 4.8 Set `this.responseHeaders` from HTTP response headers (lowercased keys) after every service step request
- [ ] 4.9 Add integration tests for step execution: plain step sends no body/params, `body` rows with schema use defaults+overrides, `body` rows without schema build from DataTable, `params` rows produce correct query string, `header` request rows override service headers, `this.responseHeaders` populated after request, path param substitution

## 5. ScenarioWorld Integration

- [ ] 5.1 Update `src/world/index.ts` to add `withServices(glob)` as a chainable static method on the class returned by `withSchemas`
- [ ] 5.2 Ensure `withServices` calls `loadServices` and then `registerServices`, and returns the same class for chaining
- [ ] 5.3 Add a warning (matching `withSchemas` behaviour) when `withServices` glob matches no files
- [ ] 5.4 Export `ServiceRegistry` type and any relevant service types from `src/index.ts`
- [ ] 5.5 Add unit tests for `withServices`: chainable after `withSchemas`, empty glob warning, registered steps available to Cucumber

## 6. Example

- [ ] 6.1 Create `examples/service/` with a working end-to-end example using `services/*.feature`, `schemas/*.feature`, and a feature test using auto-registered service steps — covering plain steps, `with:` overrides, `body`/`params`/`header` request rows, and `body`/`header` response assertions
- [ ] 6.2 Verify the example runs with `npm test` inside `examples/service/`
