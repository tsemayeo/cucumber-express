import { describe, it, expect } from 'vitest'
import { setPath } from '../../src/build/setpath.js'
import { parsePath } from '../../src/util/parse.js'

describe('setPath — key segments', () => {
  it('overrides an existing leaf field, siblings preserved', () => {
    const obj = { body: { user: { name: 'John', role: 'member' } } }
    setPath(parsePath('body.user.name'), obj, 'Jane')
    expect(obj).toEqual({ body: { user: { name: 'Jane', role: 'member' } } })
  })

  it('creates a new leaf key not in the original object', () => {
    const obj = { body: { user: { name: 'John' } } }
    setPath(parsePath('body.user.email'), obj, 'john@example.com')
    expect(obj).toEqual({ body: { user: { name: 'John', email: 'john@example.com' } } })
  })

  it('creates intermediate objects for a missing key', () => {
    const obj: Record<string, unknown> = { body: {} }
    setPath(parsePath('body.address.city'), obj, 'London')
    expect(obj).toEqual({ body: { address: { city: 'London' } } })
  })

  it('throws when a non-object sits in a key path', () => {
    const obj = { body: { user: 'not-an-object' } }
    expect(() => setPath(parsePath('body.user.name'), obj, 'John')).toThrow('body.user')
  })
})

describe('setPath — index segments', () => {
  it('overrides a field on an existing array element, other fields preserved', () => {
    const obj = { body: { items: [{ name: 'Widget', qty: 1 }] } }
    setPath(parsePath('body.items[0].name'), obj, 'Gadget')
    expect(obj).toEqual({ body: { items: [{ name: 'Gadget', qty: 1 }] } })
  })

  it('throws when element at index does not exist', () => {
    const obj = { body: { items: [{ name: 'Widget' }] } }
    expect(() => setPath(parsePath('body.items[2].name'), obj, 'Thing')).toThrow('2')
  })

  it('allows writing to a valid index that holds undefined', () => {
    const obj = { items: [1, undefined, 3] as unknown[] }
    setPath(parsePath('items[1]'), obj, 42)
    expect(obj.items[1]).toBe(42)
  })

  it('throws when a non-array sits where an index is expected', () => {
    const obj = { body: { items: 'not-an-array' } }
    expect(() => setPath(parsePath('body.items[0].name'), obj, 'Widget')).toThrow('body.items')
  })
})

describe('setPath — collection operators', () => {
  it('throws on [*] in intermediate position', () => {
    const obj = { body: { items: [{ name: 'Widget' }] } }
    expect(() => setPath(parsePath('body.items[*].name'), obj, 'x')).toThrow('Collection operators')
  })

  it('throws on [+] in intermediate position', () => {
    const obj = { body: { items: [{ name: 'Widget' }] } }
    expect(() => setPath(parsePath('body.items[+].name'), obj, 'x')).toThrow('Collection operators')
  })

  it('throws on [-] as the final segment', () => {
    const obj = { body: { items: [] as unknown[] } }
    expect(() => setPath(parsePath('body.items[-]'), obj, 'x')).toThrow('Collection operators')
  })
})
