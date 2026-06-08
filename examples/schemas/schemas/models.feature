Feature: Schema definitions

  Schema: Customer
    | name   | (faker) person.fullName |
    | email  | (faker) internet.email  |
    | role   | member                  |
    | age    | (int) 0                 |
    | active | (boolean) true          |
    | tags   | (array)                 |

  Schema: AdminCustomer
    | (extends) | Customer |
    | role      | admin    |

  Schema: CartItem
    | name  | (faker) commerce.productName |
    | qty   | (int) 1                      |
    | price | (float) 9.99                 |

  Schema: Order
    | customer | (schema) Customer  |
    | items    | (array:2) CartItem |
    | status   | pending            |
    | total    | (float) 0.0        |
