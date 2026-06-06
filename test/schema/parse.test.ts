import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseSchemaFile } from '../../src/schema/parse.js'

const fixturesDir = join(import.meta.dirname, 'fixtures')

describe('parseSchemaFile', () => {
  it('returns [] for content with no schemas', () => {
    expect(parseSchemaFile('Feature: nothing\n\n  Just some text.', 'f.feature')).toEqual([])
  })

  it('single schema with literal values', () => {
    const content = 'Schema: User\n  | name | Alice |\n  | role | admin |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.name).toBe('User')
    expect(def.fileName).toBe('f.feature')
    expect(def.rows).toEqual([
      { kind: 'field', path: 'name', value: { kind: 'literal', value: 'Alice' } },
      { kind: 'field', path: 'role', value: { kind: 'literal', value: 'admin' } },
    ])
  })

  it('(faker) without argument', () => {
    const content = 'Schema: User\n  | name | (faker) person.fullName |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'field', path: 'name', value: { kind: 'faker', path: 'person.fullName' } })
  })

  it('(faker) with numeric argument', () => {
    const content = 'Schema: Post\n  | body | (faker) lorem.words(3) |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'field', path: 'body', value: { kind: 'faker', path: 'lorem.words', arg: 3 } })
  })

  it('(faker) with string argument', () => {
    const content = 'Schema: Post\n  | slug | (faker) helpers.slugify(foo) |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'field', path: 'slug', value: { kind: 'faker', path: 'helpers.slugify', arg: 'foo' } })
  })

  it('(schema) reference', () => {
    const content = 'Schema: Order\n  | address | (schema) Address |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'field', path: 'address', value: { kind: 'schema', name: 'Address' } })
  })

  it('(extends) row', () => {
    const content = 'Schema: AdminUser\n  | (extends) | User |\n  | role | admin |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'extends', baseName: 'User' })
    expect(def.rows[1]).toEqual({ kind: 'field', path: 'role', value: { kind: 'literal', value: 'admin' } })
  })

  it('(array) with typed item schema', () => {
    const content = 'Schema: Order\n  | items | (array) OrderItem |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'OrderItem' } })
  })

  it('(array) without item type', () => {
    const content = 'Schema: User\n  | tags | (array) |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'field', path: 'tags', value: { kind: 'array' } })
    expect((def.rows[0] as any).value.itemSchema).toBeUndefined()
  })

  it('(array:N) with type name', () => {
    const content = 'Schema: Order\n  | items | (array:3) OrderItem |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'OrderItem', count: 3 } })
  })

  it('(array:0) with type name', () => {
    const content = 'Schema: Order\n  | items | (array:0) OrderItem |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'OrderItem', count: 0 } })
  })

  it('(array:N) without type name parses count', () => {
    const content = 'Schema: Order\n  | items | (array:1) |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'field', path: 'items', value: { kind: 'array', count: 1 } })
  })

  it('(int) prefix falls through to literal', () => {
    const content = 'Schema: Product\n  | quantity | (int) 42 |'
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows[0]).toEqual({ kind: 'field', path: 'quantity', value: { kind: 'literal', value: '(int) 42' } })
  })

  it('multiple schemas in one file', () => {
    const content = [
      'Schema: A',
      '  | x | 1 |',
      'Schema: B',
      '  | y | 2 |',
      'Schema: C',
      '  | z | 3 |',
    ].join('\n')
    const defs = parseSchemaFile(content, 'f.feature')
    expect(defs).toHaveLength(3)
    expect(defs.map(d => d.name)).toEqual(['A', 'B', 'C'])
  })

  it('non-table lines (Feature header, comments, blank lines) are ignored', () => {
    const content = [
      'Feature: My schemas',
      '',
      '  # This is a comment',
      '  Schema: User',
      '  | name | Alice |',
      '',
      '  Some prose here.',
    ].join('\n')
    const [def] = parseSchemaFile(content, 'f.feature')
    expect(def.rows).toHaveLength(1)
  })

  it('sets fileName on every definition', () => {
    const content = 'Schema: A\n  | x | 1 |\nSchema: B\n  | y | 2 |'
    const defs = parseSchemaFile(content, 'my/schemas.feature')
    expect(defs.every(d => d.fileName === 'my/schemas.feature')).toBe(true)
  })

  it('fixture round-trip: valid.feature parses all 6 schemas with correct row counts', () => {
    const content = readFileSync(join(fixturesDir, 'valid.feature'), 'utf8')
    const defs    = parseSchemaFile(content, 'valid.feature')

    const byName = Object.fromEntries(defs.map(d => [d.name, d]))

    expect(Object.keys(byName)).toEqual(expect.arrayContaining(['Address', 'Product', 'OrderItem', 'Order', 'AdminUser', 'User']))
    expect(byName['Address'].rows).toHaveLength(3)
    expect(byName['AdminUser'].rows).toHaveLength(2)  // (extends) + role
    expect(byName['User'].rows).toHaveLength(6)
  })
})
