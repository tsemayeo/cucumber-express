Feature: Schema fixtures — valid

  Schema: Address
    | street | (faker) location.streetAddress |
    | city   | (faker) location.city          |
    | zip    | (faker) location.zipCode       |

  Schema: Product
    | id    | (int)  |
    | name  | (string) |
    | price | (float)  |

  Schema: OrderItem
    | product  | (schema) Product |
    | quantity | (int)            |

  Schema: Order
    | id       | (int)            |
    | items    | (array) OrderItem |
    | shipping | (schema) Address |

  Schema: AdminUser
    | (extends) | User  |
    | role      | admin |

  Schema: User
    | id      | (int)                    |
    | name    | (faker) person.fullName  |
    | email   | (faker) internet.email   |
    | address | (schema) Address         |
    | orders  | (array) Order            |
    | tags    | (array)                  |
