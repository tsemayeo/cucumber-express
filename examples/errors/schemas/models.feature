Feature: Schema definitions for errors example

  Schema: Product
    | title    | (faker) commerce.productName |
    | price    | (float) 9.99                 |
    | quantity | (int) 1                      |

  Schema: Cart
    | owner | (faker) person.fullName |
    | tags  | (array)                 |
