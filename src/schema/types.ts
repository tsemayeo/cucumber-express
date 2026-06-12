export type SchemaValueToken =
  | { kind: 'literal'; value: string }
  | { kind: 'faker';   path: string; arg?: string | number }
  | { kind: 'schema';  name: string }
  | { kind: 'array';   itemSchema?: string; count?: number }
  | { kind: 'env';     name: string }

export type SchemaRow =
  | { kind: 'field';   path: string; value: SchemaValueToken }
  | { kind: 'extends'; baseName: string }

export interface SchemaDefinition {
  name:     string
  fileName: string
  rows:     SchemaRow[]
}

export type TypedArray = unknown[] & { __itemSchema: string }

export interface ValidationError {
  fileName:    string
  line?:       number
  schemaName?: string
  message:     string
}
