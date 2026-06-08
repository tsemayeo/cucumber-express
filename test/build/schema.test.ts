import { describe, it, expect } from 'vitest'
import { DataTable } from '@cucumber/cucumber'
import { buildFromSchema } from '../../src/build/index.js'
import { SchemaRegistry } from '../../src/schema/registry.js'
import { ScenarioWorld } from '../../src/world/index.js'
import type { SchemaDefinition } from '../../src/schema/types.js'

const table = (rows: string[][]): DataTable => new DataTable(rows)

function makeDef(name: string, rows: SchemaDefinition['rows']): SchemaDefinition {
  return { name, fileName: 'test.feature', rows }
}

function makeWorld(...defs: SchemaDefinition[]): ScenarioWorld {
  const registry = new SchemaRegistry()
  for (const d of defs) registry.register(d.name, d)
  const world = new ScenarioWorld()
  world.schemas = registry
  return world
}

// ── base build ────────────────────────────────────────────────────────────────

describe('buildFromSchema — base build', () => {
  it('builds base object from schema defaults', () => {
    const world = makeWorld(makeDef('User', [
      { kind: 'field', path: 'role', value: { kind: 'literal', value: 'member' } },
    ]))
    const result = buildFromSchema('User', table([]), world) as { role: string }
    expect(result.role).toBe('member')
  })

  it('table override replaces field; other defaults preserved', () => {
    const world = makeWorld(makeDef('User', [
      { kind: 'field', path: 'role', value: { kind: 'literal', value: 'member' } },
      { kind: 'field', path: 'name', value: { kind: 'literal', value: 'Alice' } },
    ]))
    const result = buildFromSchema('User', table([['role', 'admin']]), world) as { role: string; name: string }
    expect(result.role).toBe('admin')
    expect(result.name).toBe('Alice')
  })
})

// ── value forms ───────────────────────────────────────────────────────────────

describe('buildFromSchema — value forms', () => {
  it('(int) cast in override', () => {
    const world = makeWorld(makeDef('Product', [
      { kind: 'field', path: 'qty', value: { kind: 'literal', value: '(int) 1' } },
    ]))
    const result = buildFromSchema('Product', table([['qty', '(int) 5']]), world) as { qty: number }
    expect(result.qty).toBe(5)
  })

  it('<key> world capture resolved in override', () => {
    const world = makeWorld(makeDef('User', [
      { kind: 'field', path: 'name', value: { kind: 'literal', value: 'Alice' } },
    ]))
    world.captures.set('userId', 'abc-123')
    const result = buildFromSchema('User', table([['id', '<userId>']]), world) as { id: string }
    expect(result.id).toBe('abc-123')
  })
})

// ── typed-array auto-construction ─────────────────────────────────────────────

describe('buildFromSchema — typed-array auto-construction', () => {
  it('auto-constructs a typed array item at an out-of-bounds index', () => {
    const cartItem = makeDef('CartItem', [
      { kind: 'field', path: 'qty', value: { kind: 'literal', value: '(int) 1' } },
    ])
    const order = makeDef('Order', [
      { kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'CartItem' } },
    ])
    const world = makeWorld(cartItem, order)
    const result = buildFromSchema('Order', table([['items[0].qty', '(int) 5']]), world) as { items: { qty: number }[] }
    expect(result.items).toHaveLength(1)
    expect(result.items[0].qty).toBe(5)
  })

  it('auto-construction preserves other item defaults', () => {
    const cartItem = makeDef('CartItem', [
      { kind: 'field', path: 'qty',  value: { kind: 'literal', value: '(int) 1' } },
      { kind: 'field', path: 'name', value: { kind: 'literal', value: 'Default' } },
    ])
    const order = makeDef('Order', [
      { kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'CartItem' } },
    ])
    const world = makeWorld(cartItem, order)
    const result = buildFromSchema('Order', table([['items[0].name', 'Special']]), world) as { items: { qty: number; name: string }[] }
    expect(result.items[0].qty).toBe(1)
    expect(result.items[0].name).toBe('Special')
  })

  it('auto-constructs intermediate items when index is skipped', () => {
    const cartItem = makeDef('CartItem', [
      { kind: 'field', path: 'qty', value: { kind: 'literal', value: '(int) 1' } },
    ])
    const order = makeDef('Order', [
      { kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'CartItem' } },
    ])
    const world = makeWorld(cartItem, order)
    const result = buildFromSchema('Order', table([['items[2].qty', '(int) 5']]), world) as { items: { qty: number }[] }
    expect(result.items).toHaveLength(3)
    expect(result.items[0].qty).toBe(1)
    expect(result.items[2].qty).toBe(5)
  })

  it('out-of-bounds index on untyped array throws', () => {
    const user = makeDef('User', [
      { kind: 'field', path: 'tags', value: { kind: 'array' } },
    ])
    const world = makeWorld(user)
    expect(() => buildFromSchema('User', table([['tags[0]', 'x']]), world)).toThrow()
  })
})

// ── (array:N) override ────────────────────────────────────────────────────────

describe('buildFromSchema — (array:N) override', () => {
  it('(array:N) replaces field with N built items', () => {
    const cartItem = makeDef('CartItem', [
      { kind: 'field', path: 'qty', value: { kind: 'literal', value: '(int) 1' } },
    ])
    const order = makeDef('Order', [
      { kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'CartItem' } },
    ])
    const world = makeWorld(cartItem, order)
    const result = buildFromSchema('Order', table([['items', '(array:3)']]), world) as { items: unknown[] }
    expect(result.items).toHaveLength(3)
  })

  it('(array:N) replaces schema-defaulted items', () => {
    const cartItem = makeDef('CartItem', [
      { kind: 'field', path: 'qty', value: { kind: 'literal', value: '(int) 1' } },
    ])
    const order = makeDef('Order', [
      { kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'CartItem', count: 2 } },
    ])
    const world = makeWorld(cartItem, order)
    const result = buildFromSchema('Order', table([['items', '(array:1)']]), world) as { items: unknown[] }
    expect(result.items).toHaveLength(1)
  })

  it('index overrides compose on top of (array:N)', () => {
    const cartItem = makeDef('CartItem', [
      { kind: 'field', path: 'name', value: { kind: 'literal', value: 'Default' } },
      { kind: 'field', path: 'qty',  value: { kind: 'literal', value: '(int) 1' } },
    ])
    const order = makeDef('Order', [
      { kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'CartItem' } },
    ])
    const world = makeWorld(cartItem, order)
    const result = buildFromSchema('Order', table([
      ['items', '(array:3)'],
      ['items[0].name', 'Special'],
    ]), world) as { items: { name: string; qty: number }[] }
    expect(result.items[0].name).toBe('Special')
    expect(result.items[0].qty).toBe(1)
    expect(result.items[1].name).toBe('Default')
    expect(result.items).toHaveLength(3)
  })

  it('(array:0) on typed array produces empty array', () => {
    const cartItem = makeDef('CartItem', [
      { kind: 'field', path: 'qty', value: { kind: 'literal', value: '(int) 1' } },
    ])
    const order = makeDef('Order', [
      { kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'CartItem' } },
    ])
    const world = makeWorld(cartItem, order)
    const result = buildFromSchema('Order', table([['items', '(array:0)']]), world) as { items: unknown[] }
    expect(result.items).toHaveLength(0)
  })

  it('(array:0) on untyped array throws', () => {
    const user = makeDef('User', [
      { kind: 'field', path: 'tags', value: { kind: 'array' } },
    ])
    const world = makeWorld(user)
    expect(() => buildFromSchema('User', table([['tags', '(array:0)']]), world)).toThrow('typed array')
  })

  it('(array:N) with N > 0 on untyped array throws', () => {
    const user = makeDef('User', [
      { kind: 'field', path: 'tags', value: { kind: 'array' } },
    ])
    const world = makeWorld(user)
    expect(() => buildFromSchema('User', table([['tags', '(array:2)']]), world)).toThrow('typed array')
  })

  it('(array:N) on a non-array field throws', () => {
    const user = makeDef('User', [
      { kind: 'field', path: 'name', value: { kind: 'literal', value: 'Alice' } },
    ])
    const world = makeWorld(user)
    expect(() => buildFromSchema('User', table([['name', '(array:3)']]), world)).toThrow('array fields')
  })
})

// ── syntax validation ─────────────────────────────────────────────────────────

describe('buildFromSchema — syntax validation', () => {
  it('reports path and value errors together before building', () => {
    const world = makeWorld(makeDef('User', [
      { kind: 'field', path: 'name', value: { kind: 'literal', value: 'Alice' } },
    ]))
    let error: Error | undefined
    try {
      buildFromSchema('User', table([
        ['items[]',   'value'],
        ['body.name', '(int) abc'],
      ]), world)
    } catch (e) { error = e as Error }
    expect(error?.message).toContain('items[]')
    expect(error?.message).toContain('abc')
  })

  it('rejects a collection operator in the path', () => {
    const world = makeWorld(makeDef('User', [
      { kind: 'field', path: 'tags', value: { kind: 'array' } },
    ]))
    expect(() => buildFromSchema('User', table([['tags[*]', 'x']]), world)).toThrow('[*]')
  })

  it('rejects a malformed (array:N) value', () => {
    const world = makeWorld(makeDef('User', [
      { kind: 'field', path: 'tags', value: { kind: 'array' } },
    ]))
    expect(() => buildFromSchema('User', table([['tags', '(array:abc)']]), world)).toThrow('(array:abc)')
  })

  it('does not build the schema when syntax errors are present', () => {
    let built = false
    const registry = { build: () => { built = true; return {} } } as any
    const world = new ScenarioWorld()
    world.schemas = registry
    try { buildFromSchema('User', table([['items[]', 'value']]), world) } catch { /* expected */ }
    expect(built).toBe(false)
  })
})

// ── error cases ───────────────────────────────────────────────────────────────

describe('buildFromSchema — error cases', () => {
  it('throws descriptively when schema not found', () => {
    const world = makeWorld()
    expect(() => buildFromSchema('Missing', table([]), world)).toThrow('"Missing"')
  })

  it('throws when world has no schemas', () => {
    const world = new ScenarioWorld()
    expect(() => buildFromSchema('User', table([]), world)).toThrow('schema registry')
  })
})
