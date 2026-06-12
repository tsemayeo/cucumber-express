## ADDED Requirements

### Requirement: ScenarioWorld exposes a responseHeaders property
`ScenarioWorld` SHALL expose a `responseHeaders` property of type `Record<string, string>` initialised as an empty object on construction. Service steps SHALL populate this property with the response headers after each HTTP request. `assertResponse` reads this property when evaluating `header` rows.

#### Scenario: responseHeaders is empty on construction
- **WHEN** a new `ScenarioWorld` is instantiated
- **THEN** `world.responseHeaders` is an empty object `{}`

#### Scenario: Service step populates responseHeaders after request
- **WHEN** a service step executes and the HTTP response includes `Content-Type: application/json`
- **THEN** `world.responseHeaders` contains `{ "content-type": "application/json" }` after the step

---

### Requirement: `ScenarioWorld.withServices` loads service files and registers Cucumber step definitions
The class returned by `ScenarioWorld.withSchemas` SHALL expose a `withServices(glob: string)` method that parses all `.feature` files matching the glob as service definitions, registers Cucumber step definitions for every declared operation as a side effect, and returns the same configured class. Calling `withServices` SHALL be chainable after `withSchemas`. Parsing and step registration SHALL happen once at call time, not per scenario.

#### Scenario: withServices is chainable after withSchemas
- **WHEN** `ScenarioWorld.withSchemas('./schemas/**/*.feature').withServices('./services/**/*.feature')` is called
- **THEN** the expression resolves to a single class usable as a Cucumber world constructor

#### Scenario: Step definitions are registered before scenarios run
- **WHEN** `withServices` is called with a glob matching a service file containing `When I fetch products`
- **THEN** Cucumber recognises `When I fetch products` as a valid step in any scenario file

#### Scenario: Empty glob logs warning
- **WHEN** `withServices` is called with a glob that matches no files
- **THEN** a warning is emitted identifying the glob and no steps are registered (no error thrown)

#### Scenario: withSchemas and withServices registrations are independent
- **WHEN** `withSchemas` is called with a valid glob and `withServices` is called with a glob matching no files
- **THEN** the schema registry is still populated and no error is thrown
