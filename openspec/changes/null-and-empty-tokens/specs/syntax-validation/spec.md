## MODIFIED Requirements

### Requirement: Validate buildRequest value syntax before processing
`buildRequest` SHALL validate every value string in the DataTable. A value is syntactically invalid if a type cast prefix is used with a value that cannot be cast to that type, or if a type cast prefix is combined with a reserved token (`<null>` or `<empty>`). All syntax errors across all rows SHALL be collected and thrown together.

Invalid build value forms:
- `(int) x` where `x` (after stripping a `<key>` lookup) is not a valid integer string
- `(float) x` where `x` is not a valid finite float string
- `(boolean) x` where `x` is not exactly `"true"` or `"false"`
- `(int) <null>`, `(float) <null>`, `(boolean) <null>`, or any cast prefix combined with `<null>` or `<empty>`

Combined cast + lookup forms such as `(int) <key>` are syntactically valid for non-reserved keys; the resolved value is only known at runtime.

#### Scenario: Non-numeric int rejected
- **WHEN** a value is `(int) abc`
- **THEN** a syntax error is thrown (not silently set to `NaN`)

#### Scenario: Empty int rejected
- **WHEN** a value is `(int) ` (empty after prefix)
- **THEN** a syntax error is thrown

#### Scenario: Non-numeric float rejected
- **WHEN** a value is `(float) abc`
- **THEN** a syntax error is thrown

#### Scenario: Invalid boolean rejected
- **WHEN** a value is `(boolean) maybe` or `(boolean) ` (anything other than `true` or `false`)
- **THEN** a syntax error is thrown (not silently set to `false`)

#### Scenario: Cast with lookup passes syntax validation
- **WHEN** a value is `(int) <count>` or `(float) <price>`
- **THEN** no syntax error is thrown (runtime check only)

#### Scenario: Cast combined with `<null>` is rejected
- **WHEN** a value is `(int) <null>` or `(boolean) <null>`
- **THEN** a syntax error is thrown

#### Scenario: Cast combined with `<empty>` is rejected
- **WHEN** a value is `(int) <empty>` or `(string) <empty>`
- **THEN** a syntax error is thrown

#### Scenario: Valid build values pass validation
- **WHEN** a value is `(int) 30`, `(float) 9.99`, `(boolean) true`, `(boolean) false`, `hello`, `<key>`, `<null>`, or `<empty>`
- **THEN** no syntax error is thrown for that value

#### Scenario: All value errors reported together
- **WHEN** multiple rows have invalid values
- **THEN** the thrown error message contains all value errors

#### Scenario: Path and value errors reported together
- **WHEN** one row has an invalid path and another has an invalid value
- **THEN** the thrown error message contains both errors

## MODIFIED Requirements

### Requirement: Validate assertResponse value syntax before processing
`assertResponse` SHALL validate every value string in the DataTable. A value is syntactically invalid if it contains a regex pattern that is not a valid regular expression. All syntax errors across all rows SHALL be collected and thrown together. The reserved tokens `<null>`, `<present>`, and `<empty>` are valid assert values.

#### Scenario: Invalid regex in /pattern/ form rejected
- **WHEN** a value is `/unclosed(/` or any `/pattern/` where pattern is not a valid regex
- **THEN** a syntax error is thrown before any evaluation occurs

#### Scenario: Invalid regex in capture gate rejected
- **WHEN** a value is `{key:/unclosed(/}` or any `{key:/pattern/}` where pattern is not a valid regex
- **THEN** a syntax error is thrown

#### Scenario: Malformed capture gate (missing closing slash) rejected
- **WHEN** a value matches `{key:...}` but does not end with `/}` (e.g. `{key:/unclosed}`)
- **THEN** it is treated as a syntax error, not silently as a literal string

#### Scenario: Valid assert values pass validation
- **WHEN** a value is a literal string, `<null>`, `<present>`, `<empty>`, `{key}`, `{key:/^J/}`, `<key>`, or `/^J/`
- **THEN** no syntax error is thrown for that value
