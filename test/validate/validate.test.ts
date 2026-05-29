import { describe, it, expect } from 'vitest'
import { DataTable } from '@cucumber/cucumber'
import { validateResponse } from '../../src/validate/index.js'
import { ScenarioWorld } from '../../src/world/index.js'

const table = (rows: string[][]): DataTable => new DataTable(rows)

const obj = {
  body: {
    user: { name: 'John' },
    items: [
      { status: 'active',   type: 'product', category: 'item', active: true,  deleted: false },
      { status: 'pending',  type: 'product', category: 'item', active: true,  deleted: false },
      { status: 'inactive', type: 'service', category: 'item', active: false, deleted: true  },
    ],
  },
}

describe('validateResponse', () => {
  it('does not throw when all rows pass', () => {
    expect(() =>
      validateResponse(table([
        ['body.user.name',       'John'],
        ['body.items[0].status', 'active'],
      ]), obj)
    ).not.toThrow()
  })

  it('throws with a single failure', () => {
    expect(() =>
      validateResponse(table([['body.user.name', 'Jane']]), obj)
    ).toThrow('body.user.name')
  })

  it('throws with all failure lines when multiple rows fail', () => {
    let error: Error | undefined
    try {
      validateResponse(table([
        ['body.user.name',       'Jane'],
        ['body.items[0].status', 'inactive'],
      ]), obj)
    } catch (e) {
      error = e as Error
    }
    expect(error?.message).toContain('body.user.name')
    expect(error?.message).toContain('body.items[0].status')
  })

  it('passes with some operator end-to-end', () => {
    expect(() =>
      validateResponse(table([['body.items[*].type', 'service']]), obj)
    ).not.toThrow()
  })

  it('passes with all operator end-to-end', () => {
    expect(() =>
      validateResponse(table([['body.items[+].category', 'item']]), obj)
    ).not.toThrow()
  })

  it('passes with none operator end-to-end', () => {
    expect(() =>
      validateResponse(table([['body.items[-].type', 'widget']]), obj)
    ).not.toThrow()
  })
})

describe('validateResponse with captures', () => {
  it('stores a value in world.captures', () => {
    const world = new ScenarioWorld()
    validateResponse(table([['body.id', '{userId}']]), { body: { id: 'abc-123' } }, world)
    expect(world.captures.get('userId')).toBe('abc-123')
  })

  it('lookup throws when value does not match captured value', () => {
    const world = new ScenarioWorld()
    world.captures.set('userId', 'abc-123')
    expect(() =>
      validateResponse(table([['body.id', '<userId>']]), { body: { id: 'xyz-999' } }, world)
    ).toThrow('body.id')
  })

  it('lookup throws when key not in world.captures', () => {
    const world = new ScenarioWorld()
    expect(() =>
      validateResponse(table([['body.id', '<userId>']]), { body: { id: 'abc-123' } }, world)
    ).toThrow('<userId>')
  })

  it('does not treat <null> as a capture when world is provided', () => {
    const world = new ScenarioWorld()
    expect(() =>
      validateResponse(table([['body.meta', '<null>']]), { body: { meta: null } }, world)
    ).not.toThrow()
  })

  it('does not treat a plain literal as a capture when world is provided', () => {
    const world = new ScenarioWorld()
    expect(() =>
      validateResponse(table([['body.user.name', 'John']]), obj, world)
    ).not.toThrow()
  })

  it('behaves identically to the original two-argument call when no world is provided', () => {
    expect(() =>
      validateResponse(table([['body.user.name', 'John']]), obj)
    ).not.toThrow()
  })
})
