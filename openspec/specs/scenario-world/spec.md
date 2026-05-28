# Scenario World Spec

### Requirement: ScenarioWorld holds a captures map
The library SHALL export a `ScenarioWorld` class from `src/world/index.ts`. The class SHALL expose a `captures` property of type `Map<string, string>` initialised as an empty map on construction.

#### Scenario: Captures map is empty on construction
- **WHEN** a new `ScenarioWorld` is instantiated
- **THEN** `world.captures` is a `Map` with size `0`

#### Scenario: Values can be stored and retrieved
- **WHEN** `world.captures.set("userId", "abc-123")` is called
- **THEN** `world.captures.get("userId")` returns `"abc-123"`
