Feature: Schema fixtures — invalid

  # Error 1: empty schema name
  Schema:
    | name | Alice |

  # Error 2: schema name with a dot
  Schema: User.Profile
    | name | Alice |

  # Error 3: schema block with no rows (followed by next schema)
  Schema: Empty

  Schema: WithRows
    | name | Alice |

  # Error 4: row with too many columns
  Schema: TooManyColumns
    | a | b | c |

  # Error 5: unrecognised value prefix
  Schema: BadPrefix
    | id | (uuid) something |

  # Error 6: invalid (faker) syntax — single word
  Schema: BadFaker
    | x | (faker) justOneWord |

  # Error 7: (schema) name with a dot
  Schema: BadSchemaRef
    | addr | (schema) Cart.Item |

  # Error 8: (array) item type with a dot
  Schema: BadArrayRef
    | items | (array) Cart.Item |

  # Error 9: more than one (extends) row
  Schema: MultiExtends
    | (extends) | A |
    | (extends) | B |
    | name      | Alice |
