Feature: Error paths — buildFromSchema and assertResponse

  Scenario: Unknown schema name
    When I try to build a Ghost from schema
    Then the error should contain "Ghost"

  Scenario: Collection operator in build path
    When I try to build a Product from schema with:
      | price[*] | 9.99 |
    Then the error should contain "collection operators"

  Scenario: Invalid integer cast value
    When I try to build a Product from schema with:
      | quantity | (int) not-a-number |
    Then the error should contain "not a valid integer"

  Scenario: Lookup key not in world captures
    When I try to build a Product from schema with:
      | title | <missingKey> |
    Then the error should contain "not found in world.captures"

  Scenario: (array:N) on an untyped array field
    When I try to build a Cart from schema with:
      | tags | (array:3) |
    Then the error should contain "requires a typed array"

  Scenario: assertResponse fails when value does not match
    Given I have a built Product
    When I try to assert the request with:
      | price | 9999.00 |
    Then the error should contain "price"

  Scenario: assertResponse fails when key is missing in object
    Given I have a built Product
    When I try to assert the request with:
      | nonexistent | anything |
    Then the error should contain "not found"
