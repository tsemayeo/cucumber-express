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

### Sentinel values

Use sentinel strings for comparisons that can't be expressed as a plain string:

| Sentinel | Meaning |
|---|---|
| `<null>` | The value must be `null` |
| `<present>` | The value must not be `null` or `undefined` |

```gherkin
| body.user.deleted | <null>    |
| body.session.id   | <present> |
```

Sentinels also work with array operators:

```gherkin
| body.items[*].deletedAt | <null>    |
| body.items[+].id        | <present> |
```

## Error messages

When validation fails, the thrown error lists every failing row:

```
[body.user.name] expected "Jane", got "John"
[body.items[*].type] expected some to equal "widget", got ["product", "product", "service"]
```
