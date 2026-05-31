import { describe, it, expect } from 'vitest'
import { evaluate } from '../../src/assert/evaluate.js'
import { ScenarioWorld } from '../../src/world/index.js'

const obj = {
  body: {
    user: { name: 'John' },
    status: 200,
    meta: null,
    items: [
      { status: 'active',   type: 'product', category: 'item', active: true,  deleted: false },
      { status: 'pending',  type: 'product', category: 'item', active: true,  deleted: false },
      { status: 'inactive', type: 'service', category: 'item', active: false, deleted: true  },
    ],
  },
}

describe('evaluate', () => {
  it('returns null on simple match', () => {
    expect(evaluate('body.user.name', 'John', obj)).toBeNull()
  })

  it('returns failure string on simple mismatch', () => {
    const result = evaluate('body.user.name', 'Jane', obj)
    expect(result).toContain('body.user.name')
    expect(result).toContain('Jane')
    expect(result).toContain('John')
  })

  it('coerces number to string', () => {
    expect(evaluate('body.status', '200', obj)).toBeNull()
  })

  it('coerces boolean to string', () => {
    expect(evaluate('body.items[0].active', 'true', obj)).toBeNull()
  })

  it('coerces null to string', () => {
    expect(evaluate('body.meta', 'null', obj)).toBeNull()
  })

  it('returns null when some operator matches at least one', () => {
    expect(evaluate('body.items[*].type', 'service', obj)).toBeNull()
  })

  it('returns failure string when some operator matches none', () => {
    const result = evaluate('body.items[*].type', 'widget', obj)
    expect(result).toContain('body.items[*].type')
    expect(result).toContain('some')
    expect(result).toContain('widget')
  })

  it('returns null when all operator matches every element', () => {
    expect(evaluate('body.items[+].category', 'item', obj)).toBeNull()
  })

  it('returns failure string when all operator does not match every element', () => {
    const result = evaluate('body.items[+].active', 'true', obj)
    expect(result).toContain('body.items[+].active')
    expect(result).toContain('all')
  })

  it('returns null when none operator matches no elements', () => {
    expect(evaluate('body.items[-].type', 'widget', obj)).toBeNull()
  })

  it('returns failure string when none operator matches at least one element', () => {
    const result = evaluate('body.items[-].active', 'true', obj)
    expect(result).toContain('body.items[-].active')
    expect(result).toContain('none')
  })

  it('<null> matches a null value', () => {
    expect(evaluate('body.meta', '<null>', obj)).toBeNull()
  })

  it('<null> does not match a non-null value', () => {
    const result = evaluate('body.user.name', '<null>', obj)
    expect(result).toContain('body.user.name')
    expect(result).toContain('<null>')
  })

  it('<present> matches a non-null non-undefined value', () => {
    expect(evaluate('body.user.name', '<present>', obj)).toBeNull()
  })

  it('<present> does not match a null value', () => {
    const result = evaluate('body.meta', '<present>', obj)
    expect(result).toContain('body.meta')
    expect(result).toContain('<present>')
  })

  it('<null> works through [*] operator: at least one null', () => {
    const data = { list: [null, 'a', null] }
    expect(evaluate('list[*]', '<null>', data)).toBeNull()
  })

  it('<present> works through [+] operator: all present', () => {
    const data = { list: ['a', 'b', 'c'] }
    expect(evaluate('list[+]', '<present>', data)).toBeNull()
  })

  it('<null> works through [-] operator: none are null', () => {
    const data = { list: ['a', 'b', 'c'] }
    expect(evaluate('list[-]', '<null>', data)).toBeNull()
  })
})

describe('evaluate — captures, lookups and regex', () => {
  it('{key} stores value in world.captures and returns null', () => {
    const world = new ScenarioWorld()
    const result = evaluate('body.user.name', '{userName}', obj, world)
    expect(result).toBeNull()
    expect(world.captures.get('userName')).toBe('John')
  })

  it('{key} without world throws', () => {
    expect(() => evaluate('body.user.name', '{userName}', obj)).toThrow('{userName}')
  })

  it('{key:/regex/} stores full value when gate passes and no capture group', () => {
    const world = new ScenarioWorld()
    const result = evaluate('body.user.name', '{name:/^J/}', obj, world)
    expect(result).toBeNull()
    expect(world.captures.get('name')).toBe('John')
  })

  it('{key:/regex/} stores capture group 1 when regex has a group', () => {
    const world = new ScenarioWorld()
    const result = evaluate('body.user.name', '{initial:/^(J)/}', obj, world)
    expect(result).toBeNull()
    expect(world.captures.get('initial')).toBe('J')
  })

  it('{key:/regex/} returns failure string and does not store when gate fails', () => {
    const world = new ScenarioWorld()
    const result = evaluate('body.user.name', '{name:/^Z/}', obj, world)
    expect(result).toContain('body.user.name')
    expect(world.captures.has('name')).toBe(false)
  })

  it('<key> returns null when captured value matches resolved value', () => {
    const world = new ScenarioWorld()
    world.captures.set('name', 'John')
    expect(evaluate('body.user.name', '<name>', obj, world)).toBeNull()
  })

  it('<key> returns failure string when captured value does not match', () => {
    const world = new ScenarioWorld()
    world.captures.set('name', 'Jane')
    const result = evaluate('body.user.name', '<name>', obj, world)
    expect(result).toContain('body.user.name')
    expect(result).toContain('Jane')
  })

  it('<key> throws when key is not in world.captures', () => {
    const world = new ScenarioWorld()
    expect(() => evaluate('body.user.name', '<name>', obj, world)).toThrow('<name>')
  })

  it('/regex/ returns null when value matches pattern', () => {
    expect(evaluate('body.user.name', '/^Jo/', obj)).toBeNull()
  })

  it('/regex/ returns failure string when value does not match pattern', () => {
    const result = evaluate('body.user.name', '/^Za/', obj)
    expect(result).toContain('body.user.name')
  })

  it('<null> is handled as built-in special, not a capture lookup', () => {
    const world = new ScenarioWorld()
    expect(evaluate('body.meta', '<null>', obj, world)).toBeNull()
  })

  it('<present> is handled as built-in special, not a capture lookup', () => {
    const world = new ScenarioWorld()
    expect(evaluate('body.user.name', '<present>', obj, world)).toBeNull()
  })
})
