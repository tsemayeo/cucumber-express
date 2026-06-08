## ADDED Requirements

### Requirement: `ScenarioWorld.withSchemas` loads schema files and returns a configured class
`ScenarioWorld` SHALL expose a static `withSchemas(glob: string)` method that parses all `.feature` files matching the glob, builds a `SchemaRegistry`, caches it as a static property on the returned class, and returns the configured class for use as a Cucumber world constructor. Parsing SHALL happen once at call time, not per scenario.

#### Scenario: Returns a class usable as world constructor
- **WHEN** `setWorldConstructor(ScenarioWorld.withSchemas('./schemas/**/*.feature'))` is called
- **THEN** Cucumber can instantiate the returned class as a world without errors

#### Scenario: Schema registry is shared across instances
- **WHEN** two world instances are created from a class returned by `withSchemas`
- **THEN** both instances reference the same `SchemaRegistry` object (no re-parsing)

#### Scenario: Empty glob logs warning
- **WHEN** `withSchemas` is called with a glob that matches no files
- **THEN** a warning is emitted identifying the glob and the registry is empty (no error thrown at load time)

---

### Requirement: World instances expose `schemas` property
Instances of the class returned by `ScenarioWorld.withSchemas` SHALL expose a `schemas` property giving access to the loaded `SchemaRegistry`. The `schemas` property SHALL be available in step definitions via `this.schemas`.

#### Scenario: `this.schemas` accessible in step definition
- **WHEN** a step definition calls `buildFromSchema("User", dataTable, this)`
- **THEN** `buildFromSchema` can resolve `"User"` via `this.schemas` without additional imports

#### Scenario: `captures` property still present
- **WHEN** a world instance is created from the class returned by `withSchemas`
- **THEN** `world.captures` is still a `Map<string, string>` initialised empty (no regression)
