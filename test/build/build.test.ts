import { describe, it, expect } from 'vitest'
import { DataTable } from '@cucumber/cucumber'
import { buildRequest } from '../../src/build/index.js'
import { ScenarioWorld } from '../../src/world/index.js'

const table = (rows: string[][]): DataTable => new DataTable(rows)

const schema = () => ({
  body: {
    user: { name: 'John', role: 'member', active: true },
    items: [
      { name: 'Widget', qty: 1 },
      { name: 'Gadget', qty: 2 },
    ],
  },
})

describe('buildRequest — schema defaults', () => {
  it('preserves fields not in the table', () => {
    const result = buildRequest(schema, table([['body.user.name', 'Jane']]))
    expect(result.body.user.role).toBe('member')
    expect(result.body.user.active).toBe(true)
  })

  it('calls schema fresh on each invocation', () => {
    const a = buildRequest(schema, table([]))
    const b = buildRequest(schema, table([]))
    expect(a).not.toBe(b)
  })
})

describe('buildRequest — string override', () => {
  it('replaces a field with a bare string value', () => {
    const result = buildRequest(schema, table([['body.user.name', 'Jane']]))
    expect(result.body.user.name).toBe('Jane')
  })
})

describe('buildRequest — typed overrides', () => {
  it('(int) sets a number', () => {
    const result = buildRequest(schema, table([['body.items[0].qty', '(int) 5']]))
    expect(result.body.items[0].qty).toBe(5)
  })

  it('(float) sets a float', () => {
    const result = buildRequest(schema, table([['body.items[0].qty', '(float) 1.5']]))
    expect(result.body.items[0].qty).toBe(1.5)
  })

  it('(boolean) true sets true', () => {
    const result = buildRequest(schema, table([['body.user.active', '(boolean) true']]))
    expect(result.body.user.active).toBe(true)
  })

  it('(boolean) false sets false', () => {
    const result = buildRequest(schema, table([['body.user.active', '(boolean) false']]))
    expect(result.body.user.active).toBe(false)
  })
})

describe('buildRequest — world lookup', () => {
  it('<key> resolves from world.captures', () => {
    const world = new ScenarioWorld()
    world.captures.set('userName', 'Alice')
    const result = buildRequest(schema, table([['body.user.name', '<userName>']]), world)
    expect(result.body.user.name).toBe('Alice')
  })
})

describe('buildRequest — combined cast + lookup', () => {
  it('(int) <key> resolves then casts', () => {
    const world = new ScenarioWorld()
    world.captures.set('qty', '9')
    const result = buildRequest(schema, table([['body.items[0].qty', '(int) <qty>']]), world)
    expect(result.body.items[0].qty).toBe(9)
  })
})

describe('buildRequest — array element override', () => {
  it('overrides a field on an existing element, siblings preserved', () => {
    const result = buildRequest(schema, table([['body.items[1].name', 'Sprocket']]))
    expect(result.body.items[1].name).toBe('Sprocket')
    expect(result.body.items[1].qty).toBe(2)
  })
})

describe('buildRequest — error cases', () => {
  it('throws when path traverses through a non-object', () => {
    const badSchema = () => ({ body: { user: 'not-an-object' } })
    expect(() =>
      buildRequest(badSchema, table([['body.user.name', 'Jane']]))
    ).toThrow('body.user')
  })

  it('throws when array index is out of bounds', () => {
    expect(() =>
      buildRequest(schema, table([['body.items[9].name', 'Thing']]))
    ).toThrow('9')
  })
})
