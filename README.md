# cucumber-express

A cucumber-js helper for validating response objects and building request objects via Gherkin data tables.

## Installation

```bash
npm install cucumber-express
npm install --save-dev @cucumber/cucumber @faker-js/faker
```

`@cucumber/cucumber` and `@faker-js/faker` are peer dependencies and must be installed separately. `@faker-js/faker` is only required if your schema files use the `(faker)` prefix.

## `assertResponse`

Call `assertResponse` inside a step definition, passing the cucumber `DataTable` and the object you want to validate:

```javascript
import { assertResponse } from 'cucumber-express'

Then('the response should match:', function (dataTable) {
  assertResponse(dataTable, this.response)
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

## `buildRequest`

Call `buildRequest` inside a step definition, passing a schema factory, the `DataTable`, and an optional world. The schema factory produces the default object (typically using faker for irrelevant fields); the table overrides only the fields that matter for the scenario.

```javascript
import { buildRequest } from 'cucumber-express'
import { faker } from '@faker-js/faker'

const userSchema = () => ({
  body: {
    user: {
      name:  faker.person.fullName(),
      email: faker.internet.email(),
      role:  'member',
    }
  }
})

When('I create a user with:', function (dataTable) {
  this.request = buildRequest(userSchema, dataTable, this)
})
```

Write a two-column data table — each row overrides one field by path:

```gherkin
When I create a user with:
  | body.user.name  | John Doe      |
  | body.user.role  | admin         |
```

Fields not in the table keep their schema-generated values. The schema is called fresh on every `buildRequest` invocation.

### Type casting

Prefix a value with `(type) ` to set a non-string field:

| Prefix | Result |
|---|---|
| `(int) 30` | `30` (integer) |
| `(float) 9.99` | `9.99` (float) |
| `(boolean) true` | `true` (boolean) |
| `(boolean) false` | `false` (boolean) |

```gherkin
When I create a product with:
  | body.product.price    | (float) 9.99   |
  | body.product.stock    | (int) 100      |
  | body.product.active   | (boolean) true |
```

### World lookups

Use `<key>` to inject a captured value from a previous step:

```gherkin
When I create a user
Then the response should match:
  | body.user.id | {userId} |

When I create an order with:
  | body.order.userId | <userId> |
```

Type casting and lookups can be combined:

```gherkin
| body.order.quantity | (int) <qty> |
```

### Array elements

The schema defines the array structure. Table rows can override fields on existing elements by index — the element must already exist in the schema output:

```javascript
const orderSchema = () => ({
  body: {
    items: [
      { name: faker.commerce.productName(), qty: 1 },
      { name: faker.commerce.productName(), qty: 1 },
    ]
  }
})
```

```gherkin
When I place an order with:
  | body.items[0].name | Widget      |
  | body.items[1].qty  | (int) 5     |
```

## Schema-based request building

Use `buildFromSchema` when you want to define request shapes in `.feature` files as named schemas, rather than inline JavaScript factory functions. Schemas support faker generation, sub-schema embedding, inheritance, and typed arrays — all shareable across steps and scenarios.

### `withSchemas` setup

Call `ScenarioWorld.withSchemas(glob)` once to load all matching `.feature` schema files and return a subclass with `this.schemas` populated. Use it as your Cucumber world constructor:

```javascript
import { ScenarioWorld } from 'cucumber-express'
import { setWorldConstructor } from '@cucumber/cucumber'

const World = ScenarioWorld.withSchemas('features/**/*.feature')
setWorldConstructor(World)
```

### Schema file format

Define schemas in `.feature` files using `Schema:` headers and two-column data tables:

```gherkin
Schema: User
  | role  | member                      |
  | name  | (faker) person.fullName     |
  | email | (faker) internet.email      |

Schema: Address
  | line1   | (faker) location.streetAddress |
  | city    | (faker) location.city          |
  | country | GB                             |

Schema: Order
  | (extends) | User                    |
  | address   | (schema) Address        |
  | items     | (array:2) CartItem      |
  | createdAt | (faker) date.recent     |

Schema: CartItem
  | name  | (faker) commerce.productName |
  | qty   | (int) 1                      |
  | price | (float) 9.99                 |
```

All recognised value prefixes:

| Value form | Produces |
|---|---|
| `member` | String literal |
| `(int) 0` | Integer |
| `(float) 0.0` | Float |
| `(boolean) true` | Boolean |
| `(string) text` | Forced string |
| `(faker) internet.email` | Faker-generated value |
| `(faker) number.int(100)` | Faker with argument |
| `(schema) Address` | Embedded sub-schema |
| `(extends) Base` | Inherit all fields from Base schema |
| `(array)` | Empty untyped array |
| `(array) CartItem` | Empty typed array (auto-extends on OOB index) |
| `(array:3) CartItem` | Pre-populated with 3 built CartItem instances |

### `buildFromSchema`

Call `buildFromSchema` inside a step definition, passing the schema name, the `DataTable`, and `this`. It builds the named schema as the base object and applies table overrides on top:

```javascript
import { buildFromSchema } from 'cucumber-express'

When('I create an order with:', function (dataTable) {
  this.request = buildFromSchema('Order', dataTable, this)
})
```

```gherkin
When I create an order with:
  | items         | (array:2)   |
  | items[0].name | Widget      |
  | items[1].qty  | (int) 5     |
```

Table overrides support the same path and value syntax as `buildRequest` — type casts, world lookups, `<null>`, `<empty>`. Two additional behaviours apply:

**Typed array auto-extension** — writing to an out-of-bounds index on a typed array automatically builds and inserts items up to that index with schema defaults:

```gherkin
| items[2].name | Special |
```

If `items` was empty, this creates items 0, 1, and 2 — items 0 and 1 get schema defaults, item 2 gets `name` overridden.

**`(array:N)` override** — replaces the entire array field with N freshly built items. The field must be a typed array in the schema:

```gherkin
| items | (array:3) |
```

Collection operators (`[*]`, `[+]`, `[-]`) are not valid in build tables.

## Path syntax

The first column is a dot-separated path from the root object.

### Dot notation

```
body.user.name         → object.body.user.name
headers.content-type   → object.headers["content-type"]
```

### Array index

```
body.items[0].name    → first item's name
```

### Array operators (`assertResponse` only)

| Operator | Meaning |
|---|---|
| `[n]` | The element at index `n` |
| `[*]` | At least one element must equal the expected value |
| `[+]` | Every element must equal the expected value |
| `[-]` | No element must equal the expected value |

## Expected value reference (`assertResponse`)

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

```gherkin
Then the response should match:
  | body.user.id  | /^usr_[a-z0-9]+$/ |
  | body.user.url | /^https?:\/\//    |
```

### Captures and lookups

Use `ScenarioWorld` to share values across steps. Register it as your Cucumber world constructor:

```javascript
import { assertResponse, buildRequest, ScenarioWorld } from 'cucumber-express'
import { setWorldConstructor } from '@cucumber/cucumber'

setWorldConstructor(ScenarioWorld)
```

Pass `this` as the third argument to `assertResponse` or `buildRequest`:

```javascript
Then('the response should match:', function (dataTable) {
  assertResponse(dataTable, this.response, this)
})

When('I create a user with:', function (dataTable) {
  this.request = buildRequest(userSchema, dataTable, this)
})
```

A complete two-step example:

```gherkin
When I create a user with:
  | body.user.name | John  |
  | body.user.role | admin |
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

When `assertResponse` fails, the thrown error lists every failing row:

```
[body.user.name] expected "Jane", got "John"
[body.items[*].type] expected some to equal "widget", got ["product", "product", "service"]
[body.user.id] expected to match {userId:/^usr_/}, got "org_abc"
```
