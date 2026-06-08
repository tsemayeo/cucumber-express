Feature: Building request objects with buildFromSchema

  Scenario: Schema defaults with faker-generated values
    When I build a Customer from schema
    Then the request should match:
      | name   | <present> |
      | email  | <present> |
      | role   | member    |

  Scenario: Schema inheritance
    When I build a AdminCustomer from schema
    Then the request should match:
      | name  | <present> |
      | email | <present> |
      | role  | admin     |

  Scenario: Override specific fields — schema defaults preserved for the rest
    When I build a Customer from schema with:
      | name | Alice Override |
      | role | premium        |
    Then the request should match:
      | name  | Alice Override |
      | role  | premium        |
      | email | <present>      |
      | age   | 0              |

  Scenario: Field override and nested sub-schema
    When I build a Order from schema with:
      | status | shipped |
    Then the request should match:
      | status        | shipped   |
      | customer.name | <present> |
      | items[0].name | <present> |

  Scenario: Array resize with (array:N)
    When I build a Order from schema with:
      | items | (array:3) |
    Then the request should match:
      | items[0].name | <present> |
      | items[2].name | <present> |

  Scenario: Array resize then override a specific element
    When I build a Order from schema with:
      | items         | (array:3)     |
      | items[1].name | Featured Item |
    Then the request should match:
      | items[0].name | <present>     |
      | items[1].name | Featured Item |
      | items[2].name | <present>     |
