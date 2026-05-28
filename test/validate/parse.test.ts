import { describe, it, expect } from 'vitest'
import { parsePath } from '../../src/validate/parse.js'

describe('parsePath', () => {
  it('parses a single key', () => {
    expect(parsePath('name')).toEqual([{ kind: 'key', value: 'name' }])
  })

  it('parses nested keys', () => {
    expect(parsePath('body.user.name')).toEqual([
      { kind: 'key', value: 'body' },
      { kind: 'key', value: 'user' },
      { kind: 'key', value: 'name' },
    ])
  })

  it('parses an index operator', () => {
    expect(parsePath('items[0]')).toEqual([
      { kind: 'key', value: 'items' },
      { kind: 'index', index: 0 },
    ])
  })

  it('parses the some operator [*]', () => {
    expect(parsePath('items[*].type')).toEqual([
      { kind: 'key', value: 'items' },
      { kind: 'some' },
      { kind: 'key', value: 'type' },
    ])
  })

  it('parses the all operator [+]', () => {
    expect(parsePath('items[+].active')).toEqual([
      { kind: 'key', value: 'items' },
      { kind: 'all' },
      { kind: 'key', value: 'active' },
    ])
  })

  it('parses the none operator [-]', () => {
    expect(parsePath('items[-].deleted')).toEqual([
      { kind: 'key', value: 'items' },
      { kind: 'none' },
      { kind: 'key', value: 'deleted' },
    ])
  })

  it('parses a full nested path with array operator', () => {
    expect(parsePath('body.items[*].status')).toEqual([
      { kind: 'key', value: 'body' },
      { kind: 'key', value: 'items' },
      { kind: 'some' },
      { kind: 'key', value: 'status' },
    ])
  })

  it('throws on an invalid array operator', () => {
    expect(() => parsePath('items[?]')).toThrow('[?]')
  })
})
