Feature: Building request objects with buildRequest

  Scenario: Override specific fields — schema defaults preserved for the rest
    When I build a customer request with:
      | name | Alice |
    Then the request should match:
      | name   | Alice  |
      | role   | member |
      | age    | 0      |
      | active | false  |

  Scenario: Type casts
    When I build a customer request with:
      | name   | Jane Smith     |
      | age    | (int) 28       |
      | score  | (float) 9.5    |
      | active | (boolean) true |
    Then the request should match:
      | name   | Jane Smith |
      | age    | 28         |
      | score  | 9.5        |
      | active | true       |

  Scenario: Null and empty tokens
    When I build a customer request with:
      | email | <null>  |
      | tags  | <empty> |
    Then the request should match:
      | email | <null>  |
      | tags  | <empty> |

  Scenario: World lookup
    Given my world captures userId as "USR-42"
    When I build a customer request with:
      | name | <userId> |
    Then the request should match:
      | name | USR-42 |
