Feature: Asserting API responses with cucumber-express

  Scenario: Literal and coerced numeric assertions
    When I fetch product 1
    Then the response should match:
      | id       | 1                             |
      | title    | Essence Mascara Lash Princess |
      | category | beauty                        |
      | stock    | 99                            |
      | price    | 9.99                          |

  Scenario: Regex assertions
    When I fetch product 1
    Then the response should match:
      | sku       | /^[A-Z0-9-]+$/  |
      | thumbnail | /^https?:\/\//  |

  Scenario: Nested path assertions
    When I fetch product 1
    Then the response should match:
      | meta.barcode      | /^\d+$/              |
      | meta.createdAt    | /^\d{4}-\d{2}-\d{2}/ |
      | dimensions.width  | 15.14                |
      | reviews[0].rating | 3                    |

  Scenario: Capture fields then assert them with lookups
    When I fetch product 1
    Then the response should match:
      | id       | {productId} |
      | category | {category}  |
    Then the response should match:
      | id       | <productId> |
      | category | <category>  |

  Scenario: Array operator assertions on a category list
    When I fetch beauty products
    Then the response should match:
      | products[+].category | beauty      |
      | products[*].brand    | Essence     |
      | products[-].category | electronics |
