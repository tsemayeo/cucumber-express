## 1. Path Writing

- [x] 1.1 Add `setPath(segments: Segment[], obj: unknown, value: unknown): void` in `src/build/index.ts` — walks segments, creates intermediate objects/arrays, rejects collection operators, throws on type conflicts
- [x] 1.2 Write unit tests for `setPath` covering: override existing leaf, create new leaf, create intermediate objects, create array and element, sparse element creation, non-object conflict, non-array conflict, collection operator rejection

## 2. Value Parsing

- [x] 2.1 Add `parseValue(raw: string, world?: ScenarioWorld): unknown` — strips `(type)` prefix, resolves `<key>` lookup, applies cast
- [x] 2.2 Write unit tests for `parseValue` covering: bare string, `(int)`, `(float)`, `(boolean)true`, `(boolean)false`, `<key>` lookup, `(int)<key>` combined, missing key throws, lookup without world throws

## 3. `buildRequest` Function

- [x] 3.1 Implement `buildRequest<T extends object>(schema: () => T, table: DataTable, world?: ScenarioWorld): T` — calls schema, iterates rows, calls `parseValue` then `setPath` for each
- [x] 3.2 Write integration tests for `buildRequest` covering: schema values preserved for unspecified fields, string override, typed overrides (int/float/boolean), world lookup, combined cast+lookup, array element creation, sparse element, conflicting path throws

## 4. Exports

- [ ] 4.1 Export `buildRequest` from `src/index.ts` alongside `validateResponse`
