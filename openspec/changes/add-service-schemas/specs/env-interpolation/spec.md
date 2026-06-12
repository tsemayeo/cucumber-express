## ADDED Requirements

### Requirement: `<env:NAME}` token resolves to an environment variable value
The library SHALL recognise `<env:NAME}` as an interpolation token (where `NAME` is one or more uppercase letters, digits, or underscores) in two contexts: schema table value cells and service config lines. In both contexts, the token SHALL be replaced with `process.env.NAME` at the time the file is loaded. A token appearing mid-string SHALL be substituted inline, leaving surrounding text intact.

#### Scenario: Standalone env token in schema cell resolves to env var
- **WHEN** a schema row has value `<env:API_KEY>` and `process.env.API_KEY` is `"key-abc"`
- **THEN** building the schema sets that field to `"key-abc"`

#### Scenario: Inline env token in service config resolves mid-string
- **WHEN** a service config line is `header Authorization: Bearer <env:ACCESS_TOKEN>` and `process.env.ACCESS_TOKEN` is `"tok-xyz"`
- **THEN** the resolved header value is `"Bearer tok-xyz"`

#### Scenario: Env token in base URL resolves correctly
- **WHEN** a service config line is `base: <env:API_BASE_URL>` and `process.env.API_BASE_URL` is `"https://api.example.com"`
- **THEN** the service base URL is `"https://api.example.com"`

---

### Requirement: Multiple `<env:NAME}` tokens in a single value are all resolved
A value MAY contain more than one `<env:NAME}` token. All tokens SHALL be resolved independently and substituted in order.

#### Scenario: Two env tokens in one service config line are both resolved
- **WHEN** a config line is `base: <env:API_SCHEME>://<env:API_HOST>` and both env vars are set
- **THEN** the resolved value combines both substitutions correctly

---

### Requirement: Missing `<env:NAME}` token fails fast at load time
If a `<env:NAME}` token appears in a schema file or service file and `process.env.NAME` is `undefined`, the library SHALL throw an error at file load time (during `withSchemas()` or `withServices()`). The error SHALL name the missing variable and the file path. No schemas or steps from that load call SHALL be registered if any env var is missing.

#### Scenario: Missing env var in schema throws at withSchemas() time
- **WHEN** a schema file contains `| apiKey | <env:MISSING_VAR> |` and `process.env.MISSING_VAR` is undefined
- **THEN** `withSchemas()` throws an error naming `MISSING_VAR` and the schema file path

#### Scenario: Missing env var in service throws at withServices() time
- **WHEN** a service file contains `base: <env:MISSING_URL>` and `process.env.MISSING_URL` is undefined
- **THEN** `withServices()` throws an error naming `MISSING_URL` and the service file path

#### Scenario: All missing env vars across files are reported together
- **WHEN** two service files each reference a missing env var
- **THEN** a single error is thrown listing both missing variables before any steps are registered
