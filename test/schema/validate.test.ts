import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateSchemaFile, validateRegistry } from '../../src/schema/validate.js'
import type { SchemaDefinition } from '../../src/schema/types.js'

const fixturesDir = join(import.meta.dirname, 'fixtures')

// ── helpers ──────────────────────────────────────────────────────────────────

function def(name: string, fileName: string, rows: SchemaDefinition['rows'] = []): SchemaDefinition {
  return { name, fileName, rows }
}

// ── validateSchemaFile ────────────────────────────────────────────────────────

describe('validateSchemaFile', () => {
  it('reports empty schema at end of file', () => {
    const errors = validateSchemaFile('Schema: User', 'f.feature')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('no data table rows')
  })

  it('reports row with too few columns', () => {
    const errors = validateSchemaFile('Schema: User\n  | a |', 'f.feature')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('1')
  })

  it('accepts (faker) with a simple argument', () => {
    const content = 'Schema: User\n  | x | (faker) lorem.words(3) |'
    expect(validateSchemaFile(content, 'f.feature')).toEqual([])
  })

  it('accepts $ in schema names', () => {
    const content = 'Schema: $User\n  | x | y |'
    expect(validateSchemaFile(content, 'f.feature')).toEqual([])
  })

  it('accepts (array:N) with a type name', () => {
    const content = 'Schema: Order\n  | items | (array:3) OrderItem |'
    expect(validateSchemaFile(content, 'f.feature')).toEqual([])
  })

  it('accepts (array:0) with a type name', () => {
    const content = 'Schema: Order\n  | items | (array:0) OrderItem |'
    expect(validateSchemaFile(content, 'f.feature')).toEqual([])
  })

  it('rejects (array:N) without a type name', () => {
    const content = 'Schema: Order\n  | items | (array:3) |'
    const errors = validateSchemaFile(content, 'f.feature')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('requires a type name')
  })
})

// ── validateRegistry ──────────────────────────────────────────────────────────

describe('validateRegistry', () => {
  it('returns no errors for valid definitions', () => {
    const defs: SchemaDefinition[] = [
      def('Address', 'a.feature', [
        { kind: 'field', path: 'city', value: { kind: 'literal', value: 'London' } },
      ]),
      def('User', 'a.feature', [
        { kind: 'field', path: 'address', value: { kind: 'schema', name: 'Address' } },
      ]),
    ]
    expect(validateRegistry(defs)).toEqual([])
  })

  it('reports duplicate schema names across files', () => {
    const defs = [def('User', 'a.feature'), def('User', 'b.feature')]
    const errors = validateRegistry(defs)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('"User"')
    expect(errors[0].message).toContain('a.feature')
  })

  it('reports unresolvable (schema) reference', () => {
    const defs = [
      def('User', 'a.feature', [
        { kind: 'field', path: 'addr', value: { kind: 'schema', name: 'Missing' } },
      ]),
    ]
    const errors = validateRegistry(defs)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('"Missing"')
    expect(errors[0].schemaName).toBe('User')
  })

  it('reports unresolvable (extends) reference', () => {
    const defs = [def('AdminUser', 'a.feature', [{ kind: 'extends', baseName: 'Missing' }])]
    const errors = validateRegistry(defs)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('"Missing"')
  })

  it('reports unresolvable (array) type reference', () => {
    const defs = [
      def('Order', 'a.feature', [
        { kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'Missing' } },
      ]),
    ]
    const errors = validateRegistry(defs)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('"Missing"')
  })

  it('reports direct cycle (A embeds A)', () => {
    const defs = [
      def('A', 'a.feature', [
        { kind: 'field', path: 'self', value: { kind: 'schema', name: 'A' } },
      ]),
    ]
    const errors = validateRegistry(defs)
    expect(errors.some(e => e.message.includes('Circular'))).toBe(true)
    expect(errors.some(e => e.message.includes('A → A'))).toBe(true)
  })

  it('reports direct cycle (A extends A)', () => {
    const defs = [def('A', 'a.feature', [{ kind: 'extends', baseName: 'A' }])]
    const errors = validateRegistry(defs)
    expect(errors.some(e => e.message.includes('Circular'))).toBe(true)
  })

  it('reports transitive cycle (A embeds B, B embeds A)', () => {
    const defs = [
      def('A', 'a.feature', [{ kind: 'field', path: 'b', value: { kind: 'schema', name: 'B' } }]),
      def('B', 'a.feature', [{ kind: 'field', path: 'a', value: { kind: 'schema', name: 'A' } }]),
    ]
    const errors = validateRegistry(defs)
    expect(errors.some(e => e.message.includes('Circular'))).toBe(true)
    expect(errors.some(e => e.message.includes('A') && e.message.includes('B'))).toBe(true)
  })

  it('does not report cycle for schemas with broken references', () => {
    // A references Missing (broken), so A is excluded from cycle detection
    // B references A — no cycle should be reported since A is broken
    const defs = [
      def('A', 'a.feature', [{ kind: 'field', path: 'x', value: { kind: 'schema', name: 'Missing' } }]),
      def('B', 'a.feature', [{ kind: 'field', path: 'a', value: { kind: 'schema', name: 'A' } }]),
    ]
    const errors = validateRegistry(defs)
    expect(errors.every(e => !e.message.includes('Circular'))).toBe(true)
  })

  it('collects multiple reference errors', () => {
    const defs = [
      def('A', 'a.feature', [{ kind: 'field', path: 'x', value: { kind: 'schema', name: 'X' } }]),
      def('B', 'a.feature', [{ kind: 'field', path: 'y', value: { kind: 'schema', name: 'Y' } }]),
    ]
    const errors = validateRegistry(defs)
    expect(errors.length).toBeGreaterThanOrEqual(2)
  })

  it('reports missing env var for standalone <env:NAME> token', () => {
    delete process.env['TEST_MISSING_VAR']
    const defs = [def('Cfg', 'cfg.feature', [
      { kind: 'field', path: 'key', value: { kind: 'env', name: 'TEST_MISSING_VAR' } },
    ])]
    const errors = validateRegistry(defs)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('"TEST_MISSING_VAR"')
    expect(errors[0].fileName).toBe('cfg.feature')
  })

  it('collects all missing env vars across definitions before throwing', () => {
    delete process.env['TEST_VAR_A']
    delete process.env['TEST_VAR_B']
    const defs = [
      def('A', 'a.feature', [{ kind: 'field', path: 'x', value: { kind: 'env', name: 'TEST_VAR_A' } }]),
      def('B', 'b.feature', [{ kind: 'field', path: 'y', value: { kind: 'env', name: 'TEST_VAR_B' } }]),
    ]
    const errors = validateRegistry(defs)
    const messages = errors.map(e => e.message)
    expect(messages.some(m => m.includes('"TEST_VAR_A"'))).toBe(true)
    expect(messages.some(m => m.includes('"TEST_VAR_B"'))).toBe(true)
  })
})

// ── file-based fixtures ───────────────────────────────────────────────────────

describe('validateSchemaFile — fixture files', () => {
  it('valid.feature produces no errors', () => {
    const content = readFileSync(join(fixturesDir, 'valid.feature'), 'utf8')
    expect(validateSchemaFile(content, 'valid.feature')).toEqual([])
  })

  it('invalid.feature produces errors for every deliberate mistake', () => {
    const content = readFileSync(join(fixturesDir, 'invalid.feature'), 'utf8')
    const errors   = validateSchemaFile(content, 'invalid.feature')

    // Every error carries the correct fileName
    expect(errors.every(e => e.fileName === 'invalid.feature')).toBe(true)

    const messages = errors.map(e => e.message)

    // Error 1: empty schema name
    expect(messages.some(m => m.includes('cannot be empty'))).toBe(true)

    // Error 2: schema name with a dot
    expect(messages.some(m => m.includes('"User.Profile"'))).toBe(true)

    // Error 3: schema block with no rows
    expect(messages.some(m => m.includes('no data table rows') && m.includes('"Empty"'))).toBe(true)

    // Error 4: too many columns
    expect(messages.some(m => m.includes('3'))).toBe(true)

    // Error 5: unrecognised prefix
    expect(messages.some(m => m.includes('"(uuid)"'))).toBe(true)

    // Error 6: invalid (faker) syntax
    expect(messages.some(m => m.includes('(faker)'))).toBe(true)

    // Error 7: (schema) name with a dot
    expect(messages.some(m => m.includes('"Cart.Item"') && m.includes('(schema)'))).toBe(true)

    // Error 8: (array) item type with a dot
    expect(messages.some(m => m.includes('"Cart.Item"') && m.includes('(array)'))).toBe(true)

    // Error 9: more than one (extends)
    expect(messages.some(m => m.includes('more than one'))).toBe(true)
  })

  it('invalid.feature errors carry line numbers', () => {
    const content = readFileSync(join(fixturesDir, 'invalid.feature'), 'utf8')
    const errors   = validateSchemaFile(content, 'invalid.feature')
    expect(errors.every(e => typeof e.line === 'number' && e.line > 0)).toBe(true)
  })
})
