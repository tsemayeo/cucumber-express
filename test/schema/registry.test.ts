import { describe, it, expect } from 'vitest'
import { SchemaRegistry } from '../../src/schema/registry.js'
import type { SchemaDefinition } from '../../src/schema/types.js'

function makeDef(name: string, rows: SchemaDefinition['rows']): SchemaDefinition {
  return { name, fileName: 'test.feature', rows }
}

function makeRegistry(...defs: SchemaDefinition[]): SchemaRegistry {
  const r = new SchemaRegistry()
  for (const d of defs) r.register(d.name, d)
  return r
}

describe('SchemaRegistry#build', () => {
  it('plain literal string', () => {
    const r = makeRegistry(makeDef('User', [
      { kind: 'field', path: 'role', value: { kind: 'literal', value: 'member' } },
    ]))
    expect(r.build('User')).toEqual({ role: 'member' })
  })

  it('(int) literal cast', () => {
    const r = makeRegistry(makeDef('Product', [
      { kind: 'field', path: 'qty', value: { kind: 'literal', value: '(int) 42' } },
    ]))
    expect(r.build('Product')).toEqual({ qty: 42 })
  })

  it('(boolean) literal cast', () => {
    const r = makeRegistry(makeDef('Flag', [
      { kind: 'field', path: 'active', value: { kind: 'literal', value: '(boolean) true' } },
    ]))
    expect(r.build('Flag')).toEqual({ active: true })
  })

  it('(faker) no-arg produces a value', () => {
    const r = makeRegistry(makeDef('User', [
      { kind: 'field', path: 'name', value: { kind: 'faker', path: 'person.fullName' } },
    ]))
    const obj = r.build('User') as { name: unknown }
    expect(typeof obj.name).toBe('string')
    expect((obj.name as string).length).toBeGreaterThan(0)
  })

  it('(faker) with numeric arg', () => {
    const r = makeRegistry(makeDef('Post', [
      { kind: 'field', path: 'body', value: { kind: 'faker', path: 'lorem.words', arg: 3 } },
    ]))
    const obj = r.build('Post') as { body: string }
    expect(typeof obj.body).toBe('string')
    expect(obj.body.split(' ')).toHaveLength(3)
  })

  it('(schema) embeds sub-schema', () => {
    const address = makeDef('Address', [
      { kind: 'field', path: 'city', value: { kind: 'literal', value: 'London' } },
    ])
    const user = makeDef('User', [
      { kind: 'field', path: 'address', value: { kind: 'schema', name: 'Address' } },
    ])
    const r = makeRegistry(address, user)
    expect(r.build('User')).toEqual({ address: { city: 'London' } })
  })

  it('(schema) at two keys produces independent objects', () => {
    const address = makeDef('Address', [
      { kind: 'field', path: 'city', value: { kind: 'literal', value: 'London' } },
    ])
    const order = makeDef('Order', [
      { kind: 'field', path: 'billing',  value: { kind: 'schema', name: 'Address' } },
      { kind: 'field', path: 'shipping', value: { kind: 'schema', name: 'Address' } },
    ])
    const r = makeRegistry(address, order)
    const obj = r.build('Order') as { billing: object, shipping: object }
    expect(obj.billing).not.toBe(obj.shipping)
    expect(obj.billing).toEqual({ city: 'London' })
    expect(obj.shipping).toEqual({ city: 'London' })
  })

  it('(extends) inherits base fields', () => {
    const user = makeDef('User', [
      { kind: 'field', path: 'name', value: { kind: 'literal', value: 'Alice' } },
      { kind: 'field', path: 'role', value: { kind: 'literal', value: 'member' } },
    ])
    const admin = makeDef('AdminUser', [
      { kind: 'extends', baseName: 'User' },
    ])
    const r = makeRegistry(user, admin)
    expect(r.build('AdminUser')).toEqual({ name: 'Alice', role: 'member' })
  })

  it('(extends) field rows override inherited fields', () => {
    const user = makeDef('User', [
      { kind: 'field', path: 'name', value: { kind: 'literal', value: 'Alice' } },
      { kind: 'field', path: 'role', value: { kind: 'literal', value: 'member' } },
    ])
    const admin = makeDef('AdminUser', [
      { kind: 'extends', baseName: 'User' },
      { kind: 'field', path: 'role', value: { kind: 'literal', value: 'admin' } },
    ])
    const r = makeRegistry(user, admin)
    expect(r.build('AdminUser')).toEqual({ name: 'Alice', role: 'admin' })
  })

  it('(array) untyped produces empty array', () => {
    const r = makeRegistry(makeDef('User', [
      { kind: 'field', path: 'tags', value: { kind: 'array' } },
    ]))
    const obj = r.build('User') as { tags: unknown[] }
    expect(obj.tags).toEqual([])
    expect((obj.tags as any).__itemSchema).toBeUndefined()
  })

  it('(array) typed produces array with __itemSchema', () => {
    const r = makeRegistry(makeDef('Order', [
      { kind: 'field', path: 'items', value: { kind: 'array', itemSchema: 'CartItem' } },
    ]))
    const obj = r.build('Order') as { items: unknown[] }
    expect(obj.items).toHaveLength(0)
    expect((obj.items as any).__itemSchema).toBe('CartItem')
  })

  it('throws descriptively when schema not found', () => {
    const r = new SchemaRegistry()
    expect(() => r.build('Missing')).toThrow('Schema "Missing" not found in registry')
  })
})
