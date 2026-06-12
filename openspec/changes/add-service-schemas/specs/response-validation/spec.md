## MODIFIED Requirements

### Requirement: Assert object values via dot-path
The library SHALL export an `assertResponse(dataTable, responseObject, world?)` function. Each row SHALL be treated as a `[prefix, path, expectedValue]` triple with no header row. The `prefix` column SHALL be either `body` or `header`; any other value SHALL produce a runtime error. `body` rows SHALL traverse the dot-separated path on `responseObject`, stringify the resolved value, and dispatch on the expected cell using the following priority order:

1. **Capture** — if expected matches `{key}` exactly: store the stringified resolved value in `world.captures` under `key`; the row produces no failure. If expected matches `{key:/regex/}`: test the stringified resolved value against the regex; if it does not match, the row fails; if it matches, store the full value or capture group 1 (if the regex contains a group) in `world.captures` under `key`.
2. **Built-in specials** — if expected is `<null>`: pass iff value is `null`. If expected is `<present>`: pass iff value is not `null` and not `undefined`. If expected is `<empty>`: pass iff value is an array with length 0.
3. **Capture lookup** — if expected matches `<key>` (any word other than `null`, `present`, or `empty`): retrieve `world.captures.get(key)` and compare to the stringified resolved value; throw if the key is absent or world is not provided.
4. **Regex assertion** — if expected matches `/pattern/`: test the stringified resolved value against the regex; fail the row if it does not match.
5. **Literal** — compare the stringified resolved value to the expected string exactly.

Capture rows (`{key}`, `{key:/regex/}`) require `world` to be provided; an error SHALL be thrown if world is absent. Capture lookup rows (`<key>`) require `world` to be provided; an error SHALL be thrown if world is absent or the key is not in `world.captures`. `<null>`, `<present>`, and `<empty>` are reserved and SHALL NOT be used as capture key names.

#### Scenario: Simple property match with body prefix
- **WHEN** the table contains `| body | id | 1 |` and `responseObject.id` equals `1`
- **THEN** no error is thrown

#### Scenario: Simple property mismatch with body prefix
- **WHEN** the table contains `| body | title | Jane |` and `responseObject.title` equals `"John"`
- **THEN** the function throws an error naming the path, expected value, and received value

#### Scenario: Capture stores value in world
- **WHEN** the table contains `| body | id | {userId} |` and `responseObject.id` equals `"abc-123"` and a world is provided
- **THEN** no error is thrown and `world.captures.get("userId")` equals `"abc-123"`

#### Scenario: Capture lookup passes when value matches captured value
- **WHEN** `world.captures.get("userId")` equals `"abc-123"` and the table contains `| body | id | <userId> |` and `responseObject.id` equals `"abc-123"`
- **THEN** no error is thrown

#### Scenario: Regex assertion passes when value matches
- **WHEN** the table contains `| body | id | /^usr_/ |` and `responseObject.id` equals `"usr_abc"`
- **THEN** no error is thrown

#### Scenario: Invalid prefix produces a runtime error
- **WHEN** the table contains a row with `status` in column 1
- **THEN** the function throws an error naming `status` as an invalid prefix

---

## ADDED Requirements

### Requirement: Assert response headers via header prefix
`header` rows in the DataTable SHALL assert on response headers. The path column (column 2) is the header name (case-insensitive). The expected value column (column 3) supports the same dispatch rules as `body` rows: literal, regex, capture, capture lookup, and built-in specials. Response headers SHALL be provided to `assertResponse` via `world.responseHeaders` (a `Record<string, string>`); if a `header` row is present and `world` is not provided or `world.responseHeaders` is absent, the function SHALL throw an error.

#### Scenario: Header literal assertion passes
- **WHEN** the table contains `| header | Content-Type | application/json |` and `world.responseHeaders["content-type"]` equals `"application/json"`
- **THEN** no error is thrown

#### Scenario: Header assertion is case-insensitive on the header name
- **WHEN** the table contains `| header | content-type | application/json |` and `world.responseHeaders["Content-Type"]` equals `"application/json"`
- **THEN** no error is thrown

#### Scenario: Header regex assertion passes
- **WHEN** the table contains `| header | Content-Type | /json/ |` and the Content-Type header contains `"json"`
- **THEN** no error is thrown

#### Scenario: Header assertion fails when header is absent
- **WHEN** the table contains `| header | X-Custom | present |` and `world.responseHeaders` has no `X-Custom` entry
- **THEN** the function throws a failure for that row

#### Scenario: `body` and `header` rows are evaluated together and all failures collected
- **WHEN** both a `body` row and a `header` row fail
- **THEN** the thrown error lists both failures
