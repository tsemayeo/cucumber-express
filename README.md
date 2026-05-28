# cucumber-express

A cucumber-js helper for validating response objects via Gherkin data tables.

## Installation

```bash
npm install cucumber-express
```

`@cucumber/cucumber` is a peer dependency and must be installed separately.

## Usage

Call `validateResponse` inside a step definition, passing the cucumber `DataTable` and the object you want to validate:

```javascript
import { validateResponse } from 'cucumber-express'

Then('the response should match:', function (dataTable) {
  validateResponse(dataTable, this.response)
})
```

Write a two-column data table in your feature file — no header row, all rows are data:

```gherkin
Then the response should match:
  | body.user.name          | John Doe         |
  | body.user.address.city  | London           |
  | body.items[0].status    | active           |
  | body.items[*].type      | product          |
  | body.items[+].available | true             |
  | body.items[-].deleted   | true             |
```

If any rows fail, a single error is thrown listing every mismatch.

## Path syntax

The first column is a dot-separated path traversed from the root of the response object. The second column is the expected value — all comparisons are string-to-string (the resolved value is coerced with `String()`).

### Dot notation

Navigate nested objects using `.`:

```
body.user.name         → responseObject.body.user.name
headers.content-type   → responseObject.headers["content-type"]
```

### Array operators

Append an operator after the array key to assert across its elements:

| Operator | Meaning |
|---|---|
| `[n]` | The element at index `n` must equal the expected value |
| `[*]` | At least one element must equal the expected value |
| `[+]` | Every element must equal the expected value |
| `[-]` | No element must equal the expected value |

```
body.items[0].name    → first item's name equals expected
body.items[*].type    → at least one item's type equals expected
body.items[+].active  → every item's active value equals expected
body.items[-].deleted → no item's deleted value equals expected
```

### String coercion

Resolved values are coerced to strings before comparison, so numbers and booleans can be asserted directly:

```gherkin
| body.status       | 200  |
| body.user.active  | true |
```

## Expected value reference

The second column supports seven forms:

| Form | Behaviour |
|---|---|
| `John` | Literal: assert resolved value equals `"John"` |
| `<null>` | Built-in: assert value is `null` |
| `<present>` | Built-in: assert value is not `null` or `undefined` |
| `/regex/` | Regex: assert resolved value matches the pattern |
| `{key}` | Capture: store resolved value in `world.captures` as `key` |
| `{key:/regex/}` | Capture gate: assert value matches regex, then store it (or capture group 1 if the regex has a group) |
| `<key>` | Lookup: retrieve `world.captures.get(key)` and assert resolved value equals it |

`<null>` and `<present>` are reserved — they cannot be used as capture key names.

### Regex assertions

Assert that a value matches a pattern without capturing it:

```gherkin
Then the response should match:
  | body.user.id  | /^usr_[a-z0-9]+$/ |
  | body.user.url | /^https?:\/\//    |
```

Regex assertions also work with array operators:

```gherkin
| body.items[+].id | /^item_/ |
```

### Captures and lookups

Use `ScenarioWorld` to share values across steps within a scenario. Register it as your Cucumber world constructor:

```javascript
import { validateResponse, ScenarioWorld } from 'cucumber-express'
import { setWorldConstructor } from '@cucumber/cucumber'

setWorldConstructor(ScenarioWorld)
```

Then pass `this` as the third argument to `validateResponse`:

```javascript
Then('the response should match:', function (dataTable) {
  validateResponse(dataTable, this.response, this)
})
```

**`{key}` — capture a value**

Stores the resolved value in `world.captures` under `key`. The row always passes (no assertion is made about the value):

```gherkin
When I create a user
Then the response should match:
  | body.user.id   | {userId}   |
  | body.user.name | {userName} |
```

**`{key:/regex/}` — capture with gate**

Like `{key}`, but the row fails if the resolved value does not match the regex. If the regex contains a capture group, group 1 is stored instead of the full value:

```gherkin
  | body.user.id  | {userId:/^usr_[a-z0-9]+$/} |
  | body.token    | {token:/^Bearer (.+)/}      |
```

In the second example, `token` would store the portion matched by `(.+)`, not the full `Bearer …` string.

**`<key>` — look up a captured value**

Retrieves `world.captures.get(key)` and asserts the resolved value equals it. Throws if the key is not in captures:

```gherkin
When I fetch the user
Then the response should match:
  | body.id   | <userId>   |
  | body.name | <userName> |
```

A complete two-step example:

```gherkin
When I create a user
Then the response should match:
  | body.user.id   | {userId}           |
  | body.user.name | John               |
  | body.user.role | /^(admin|member)$/ |

When I fetch the user
Then the response should match:
  | body.id   | <userId> |
  | body.name | John     |
```

## Error messages

When validation fails, the thrown error lists every failing row:

```
[body.user.name] expected "Jane", got "John"
[body.items[*].type] expected some to equal "widget", got ["product", "product", "service"]
[body.user.id] expected to match {userId:/^usr_/}, got "org_abc"
```
