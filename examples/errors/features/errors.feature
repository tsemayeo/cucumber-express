Feature: Error paths — buildFromSchema and assertResponse

  Scenario: Unknown schema name
    When I try to build a Ghost from schema
    Then the error should contain "Schema \"Ghost\" not found in registry"

  Scenario: Collection operator in build path
    When I try to build a Product from schema with:
      | price[*] | 9.99 |
    Then the error should contain "Invalid path \"price[*]\": collection operators ([*], [+], [-]) are not valid in a build table"

  Scenario: Invalid integer cast value
    When I try to build a Product from schema with:
      | quantity | (int) not-a-number |
    Then the error should contain "Invalid value \"(int) not-a-number\": \"not-a-number\" is not a valid integer"

  Scenario: Lookup key not in world captures
    When I try to build a Product from schema with:
      | title | <missingKey> |
    Then the error should contain "Lookup \"<missingKey>\" not found in world.captures"

  Scenario: (array:N) on an untyped array field
    When I try to build a Cart from schema with:
      | tags | (array:3) |
    Then the error should contain "(array:3) requires a typed array (no item schema found)"

  Scenario: assertResponse fails when value does not match
    Given I have a built Product
    When I try to assert the request with:
      | price | 9999.00 |
    Then the error should contain "[price] expected \"9999.00\", got \"9.99\""

  Scenario: assertResponse fails when key is missing in object
    Given I have a built Product
    When I try to assert the request with:
      | nonexistent | anything |
    Then the error should contain "Key \"nonexistent\" not found at \"\""

  Scenario: Unrecognised value prefix in schema
    When I try to validate the schema:
      """
      Schema: Product
        | title | (xyz) something |
      """
    Then the error should contain "Unrecognised prefix \"(xyz)\" — valid prefixes are: int, float, boolean, string, faker, schema, extends, array"

  Scenario: (array:N) without an item type name
    When I try to validate the schema:
      """
      Schema: Cart
        | tags | (array:3) |
      """
    Then the error should contain "(array:3) requires a type name"

  Scenario: Schema with no data rows
    When I try to validate the schema:
      """
      Schema: Empty
      """
    Then the error should contain "Schema \"Empty\" has no data table rows"

  Scenario: Reference to unknown schema
    When I try to validate the schema:
      """
      Schema: Order
        | item | (schema) Unknown |
      """
    Then the error should contain "(schema) at \"item\" references unknown schema \"Unknown\""

  Scenario: Circular schema reference
    When I try to validate the schema:
      """
      Schema: A
        | b | (schema) B |

      Schema: B
        | a | (schema) A |
      """
    Then the error should contain "Circular schema reference: A → B → A"
