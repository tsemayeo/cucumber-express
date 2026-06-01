## Context

The library currently supports `buildRequest(schemaFn, dataTable, world)` where `schemaFn` is a JavaScript factory function. This works but creates a context switch: test authors write Gherkin for step behaviour but must drop into JS to define request shapes. The goal is to let schemas live in `.feature` files, parsed and owned by the library, and surfaced to step definitions through the existing `ScenarioWorld`.

The library already has the building blocks: `parsePath`, `setPath`, and `parseValue` (with type-prefix handling). Schema parsing and `buildFromSchema` are layered on top of these.

## Goals / Non-Goals

**Goals:**
- Schema definition files in `.feature` format, validated then parsed by this library (not Cucumber)
- Value prefixes `(faker)`, `(schema)`, `(extends)`, `(array)` in schema tables
- Schema composition via embedding and extension
- Schema registry exposed on `ScenarioWorld` via `withSchemas(glob)` static factory
- New `buildFromSchema(name, dataTable, world)` export; `buildRequest` unchanged
- Array auto-construction from declared item type when overrides reference new indices
- Pre-parse validation that accumulates all structural errors across all files before throwing

**Non-Goals:**
- Modifying `buildRequest` or any existing `validateResponse` behaviour
- Supporting `(faker)` in step-definition data tables (only in schema files)
- Dynamic/runtime schema definition (schemas are static, loaded at setup time)
- Schema validation of response shapes (schemas are for building requests only)

## Decisions

### Schema files are parsed by the library, not Cucumber

`.feature` extension gives editors Gherkin syntax highlighting for free, but these files are not registered with Cucumber. The library owns parsing via a dedicated schema file parser.

Alternative considered: standard Gherkin scenarios with tagged `@schema` scenarios. Rejected — it forces schema definitions into the test execution model (Given/When/Then) which is semantically wrong and adds Cucumber overhead.

### Two-phase validation pipeline before any schema building

`loadSchemas` runs a two-phase validation pass before any schema objects are built:

1. **Structural validation** (per-file, pre-parse): checks raw file text for correct `Schema: Name` headers, well-formed two-column data table rows, recognised value prefixes, and valid prefix syntax (e.g. `(faker) namespace.method`). All files are validated before parsing begins — errors from every file are collected and thrown together.

2. **Semantic validation** (cross-file, post-parse): after all files are parsed into `SchemaDefinition` objects, checks for duplicate schema names across files and unresolvable `(schema)` / `(extends)` references. Again, all errors are collected before throwing.

The full pipeline: validate all files → throw if errors → parse all files → register definitions → validate registry → throw if errors → return registry.

Alternative considered: fail-fast on first error during parsing. Rejected — authors with multiple schema files would have to fix errors one at a time across a re-run cycle, which is expensive and frustrating.

### Two-tier schema pattern

Atomic schemas (`User`, `Address`) use relative paths and define pure domain shapes. Request schemas (`CreateUserRequest`) mount atomic schemas at their API paths using `(schema) Name` at a path like `body.user`. This makes atomic schemas reusable across multiple request shapes without coupling them to any one API path.

Step data table overrides use full paths from the schema root, consistent with `buildRequest` today.

### Row-order semantics for extension

`(extends) Name` is processed first regardless of row position, producing the base object. All subsequent rows are applied in order on top of that base using the same `setPath` logic. This means extension + targeted overrides compose predictably.

Alternative considered: merge order determined by row position (i.e., `(extends)` could appear anywhere). Rejected — it would make schemas harder to read: extension should always be the declared base, not an interleaved operation.

### ScenarioWorld integration via static factory + static cache

`ScenarioWorld.withSchemas(glob)` parses schema files eagerly at call time (module load), stores the `SchemaRegistry` as a static property on the returned class, and passes it to every world instance at construction. Schema parsing runs once, not per scenario.

Alternative considered: instance-level loading in the world constructor. Rejected — re-parsing files for every scenario would be wasteful and non-deterministic if file reads overlap.

### `buildFromSchema` as a new export

`buildRequest` takes `() => T` as first argument. `buildFromSchema` takes a schema name string resolved via `world.schemas`. These are structurally different enough that overloading by type detection would be fragile. A distinct export preserves type safety and keeps the existing API intact for current consumers.

### Array auto-construction from declared type

When a schema row declares `| items | (array) CartItem |`, the field is stored as a typed array marker, not just `[]`. During `buildFromSchema`, when a data table override targets `items[N]` and `N` is out of bounds on a typed array, the registry builds a `CartItem` and appends it before applying the override. This avoids callers having to manually pre-populate arrays they intend to override.

## Risks / Trade-offs

- **Faker as peer dependency** → Consumers must install `@faker-js/faker` themselves. Faker is large; making it a peer dep keeps the library's install footprint small. Document clearly in README.
- **Circular schema references** → A schema that embeds itself (directly or transitively) would recurse infinitely at build time. Mitigation: detect cycles during schema resolution and throw a descriptive error naming the cycle path.
- **Schema file parsing errors are silent if glob matches nothing** → If the glob pattern is wrong, `withSchemas` finds no files and the registry is empty, producing confusing "schema not found" errors at runtime. Mitigation: log a warning when the registry is empty after loading, and throw in `buildFromSchema` with a message that includes the schema name and the glob that was used.
- **Faker method paths are stringly typed** → `(faker) person.fullNam` (typo) will throw at build time, not at schema load time. Mitigation: validate faker paths during schema parsing and throw with the offending row.
