## Why

Test suites using this library currently define request schemas as JavaScript factory functions, creating a context switch between Gherkin feature files and JS code. Defining schemas in Gherkin keeps the full test vocabulary in one language, makes schemas readable and writable by non-developers, and enables schema composition using the same table syntax already used in step definitions.

## What Changes

- **New capability**: Schema definition files — `.feature` files in a `schemas/` directory validated then parsed by this library (not Cucumber), using a `Schema: Name` header + data table syntax
- **New capability**: Schema file validation — a pre-parse phase that checks all files for structural correctness and collects every error before throwing, so authors see all problems at once rather than fixing one at a time
- **New capability**: `buildFromSchema(name, dataTable, world)` — builds a request object by resolving a named schema from the world's registry and applying table overrides, leaving `buildRequest` unchanged
- **New value prefixes** in schema tables: `(faker) person.fullName` / `(faker) lorem.words(3)` for faker-generated defaults; `(schema) Address` to embed another schema; `(extends) User` to inherit and override; `(array)` / `(array) CartItem` for empty arrays
- **Modified capability**: `ScenarioWorld` gains a schema registry and a `withSchemas(glob)` static factory method for loading schemas at world initialisation

## Capabilities

### New Capabilities

- `gherkin-schemas`: Schema definition file format, validation, parsing, registry, and all value prefixes (`(faker)`, `(schema)`, `(extends)`, `(array)`)
- `build-from-schema`: The `buildFromSchema` function — resolves a named schema, builds the base object, applies table overrides, and auto-constructs typed array slots on demand

### Modified Capabilities

- `scenario-world`: Adds schema registry property and `ScenarioWorld.withSchemas(glob)` static factory

## Impact

- New peer dependency: `@faker-js/faker` (consumers must install it alongside `@cucumber/cucumber`)
- New exports: `buildFromSchema`, types for schema registry
- `ScenarioWorld` class gains new static method and instance property — no breaking change to existing `captures` API
- `buildRequest` is unchanged
