Feature: Full workflow — build, send, assert, and chain across steps

  Scenario: Create a product and verify it is not in the standard catalog
    Given I build a NewProduct from schema with:
      | title | Special Widget |
      | price | (float) 49.99  |
    When I post the request to "/products/add"
    Then the response should match:
      | id    | {newProductId} |
      | title | Special Widget |
      | price | 49.99          |
    When I fetch 5 products
    Then the response should match:
      | products[+].title | /\w+/                         |
      | products[*].title | Essence Mascara Lash Princess |
      | products[-].id    | <newProductId>                |
