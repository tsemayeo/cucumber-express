## 1. Dependencies & Types

- [x] 1.1 Add `@faker-js/faker` as a peer dependency in `package.json`
- [x] 1.2 Define `SchemaRow`, `SchemaDefinition`, `TypedArray`, `SchemaRegistry`, and `ValidationError` types in `src/schema/types.ts`

## 2. Schema File Validation

- [x] 2.1 Implement `validateSchemaFile(content: string, fileName: string): ValidationError[]` in `src/schema/validate.ts` — check for empty schema names, missing data tables, malformed table rows (wrong column count), and unrecognised value prefixes; return all errors found, not just the first
- [x] 2.2 Validate `(faker)` prefix syntax in `validateSchemaFile` — must match `namespace.method` or `namespace.method(arg)` pattern
- [x] 2.3 Validate `(schema)`, `(extends)`, and `(array)` prefix syntax in `validateSchemaFile` — names must be non-empty identifiers; flag multiple `(extends)` rows in one schema
- [x] 2.4 Implement `validateRegistry(definitions: SchemaDefinition[]): ValidationError[]` in `src/schema/validate.ts` — check for duplicate schema names across files and unresolvable `(schema)`, `(extends)`, and `(array)` references
- [x] 2.5 Write tests for both validators in `test/schema/validate.test.ts` — structural errors, semantic errors, multiple errors collected together, clean files produce no errors

## 3. Schema File Parser

- [x] 3.1 Implement `parseSchemaFile(content: string): SchemaDefinition[]` in `src/schema/parse.ts` — split content on `Schema:` headers, parse each block's data table into rows (validation is a precondition; parser may assume well-formed input)
- [x] 3.2 Recognise and store `(faker) namespace.method` and `(faker) namespace.method(arg)` value tokens
- [x] 3.3 Recognise and store `(schema) Name` embedded schema reference tokens
- [x] 3.4 Recognise and store `(extends) Name` base schema row
- [x] 3.5 Recognise and store `(array)` (untyped) and `(array) Name` (typed) array value tokens
- [x] 3.6 Write tests for schema file parser in `test/schema/parse.test.ts`

## 4. Schema Registry & Build

- [x] 4.1 Implement `SchemaRegistry` class in `src/schema/registry.ts` with `register(name, def)` and `get(name)` methods
- [x] 4.2 Implement `SchemaRegistry#build(name)` — evaluates faker calls, embeds sub-schemas, applies `(extends)` base first then remaining rows via `setPath`
- [x] 4.3 Add cycle detection in `build` using a resolution stack; throw with the full cycle path on detection — moved to section 2 (validateRegistry)
- [x] 4.4 Implement `loadSchemas(glob: string): SchemaRegistry` in `src/schema/load.ts` — validate all files (structural), throw combined error if any fail, parse all files, validate registry (semantic), throw combined error if any fail, return registry
- [x] 4.5 Emit a console warning in `loadSchemas` when the glob matches no files
- [x] 4.6 Write tests for registry build logic in `test/schema/registry.test.ts` (faker values, embedding, extension, cycles, typed arrays, error cases)

## 5. ScenarioWorld Integration

- [ ] 5.1 Add optional `schemas` property of type `SchemaRegistry` to `ScenarioWorld` in `src/world/index.ts`
- [ ] 5.2 Implement `ScenarioWorld.withSchemas(glob: string)` static factory — calls `loadSchemas`, stores result as static property, returns a subclass whose constructor sets `this.schemas`
- [ ] 5.3 Write tests for `withSchemas` in `test/schema/world.test.ts` — registry shared across instances, `captures` still present, empty-glob warning

## 6. `buildFromSchema`

- [ ] 6.1 Implement `buildFromSchema(name: string, table: DataTable, world: ScenarioWorld): unknown` in `src/build/index.ts` — resolve schema via `world.schemas`, build base object, apply table overrides using existing `parsePath`/`setPath`/`parseValue`
- [ ] 6.2 Add typed-array auto-construction: when an override targets an out-of-bounds index on a `(array) Name` field, build a `Name` instance and append before applying the field override
- [ ] 6.3 Throw descriptively when schema name not found or world not provided
- [ ] 6.4 Write tests for `buildFromSchema` in `test/build/buildFromSchema.test.ts` (base build, overrides, type casts, world captures, auto-construction, untyped array OOB error)

## 7. Exports & Documentation

- [ ] 7.1 Export `buildFromSchema` and `SchemaRegistry` type from `src/index.ts`
- [ ] 7.2 Update README — add `buildFromSchema` usage, schema file format reference (all prefixes), `withSchemas` setup, and peer dependency note for `@faker-js/faker`
