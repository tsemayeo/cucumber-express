import { faker } from '@faker-js/faker'
import type { SchemaDefinition, TypedArray } from './types.js'
import { parsePath } from '../util/parse.js'
import { setPath } from '../build/setpath.js'
import { parseValue } from '../build/parsevalue.js'

export class SchemaRegistry {
  private readonly defs = new Map<string, SchemaDefinition>()

  register(name: string, def: SchemaDefinition): void {
    this.defs.set(name, def)
  }

  get(name: string): SchemaDefinition | undefined {
    return this.defs.get(name)
  }

  build(name: string): Record<string, unknown> {
    const def = this.defs.get(name)
    if (!def) throw new Error(`Schema "${name}" not found in registry`)

    const extendsRow = def.rows.find(r => r.kind === 'extends')
    const obj: Record<string, unknown> = extendsRow ? { ...this.build(extendsRow.baseName) } : {}

    for (const row of def.rows) {
      if (row.kind !== 'field') continue
      const { path, value: token } = row
      let value: unknown

      if (token.kind === 'literal') {
        value = parseValue(token.value)
      } else if (token.kind === 'faker') {
        const [ns, method] = token.path.split('.')
        const namespace = (faker as unknown as Record<string, Record<string, (...args: unknown[]) => unknown>>)[ns]
        value = token.arg !== undefined ? namespace[method](token.arg) : namespace[method]()
      } else if (token.kind === 'schema') {
        value = this.build(token.name)
      } else if (token.kind === 'array') {
        value = token.itemSchema ? Object.assign([], { __itemSchema: token.itemSchema }) as TypedArray : []
      }

      setPath(parsePath(path), obj, value)
    }

    return obj
  }
}
