import { describe, it, expect } from 'vitest'
import { resolvePath } from '../../src/validate/resolve.js'
import { parsePath } from '../../src/validate/parse.js'

const obj = {
  body: {
    user: { name: 'John' },
    items: [
      { status: 'active',   type: 'product', active: true,  deleted: false },
      { status: 'pending',  type: 'product', active: true,  deleted: false },
      { status: 'inactive', type: 'service', active: false, deleted: true  },
    ],
  },
}

describe('resolvePath', () => {
  it('resolves nested keys', () => {
    expect(resolvePath(parsePath('body.user.name'), obj)).toEqual({ kind: 'value', value: 'John' })
  })

  it('throws on missing key', () => {
    expect(() => resolvePath(parsePath('body.user.age'), obj)).toThrow('"age"')
  })

  it('resolves a valid index', () => {
    expect(resolvePath(parsePath('body.items[0].status'), obj)).toEqual({ kind: 'value', value: 'active' })
  })

  it('throws on out-of-bounds index', () => {
    expect(() => resolvePath(parsePath('body.items[5].status'), obj)).toThrow('5')
  })

  it('throws when index target is not an array', () => {
    expect(() => resolvePath(parsePath('body.user[0]'), obj)).toThrow('body.user')
  })

  it('resolves some operator', () => {
    expect(resolvePath(parsePath('body.items[*].type'), obj)).toEqual({
      kind: 'collection',
      op: 'some',
      values: ['product', 'product', 'service'],
    })
  })

  it('resolves all operator', () => {
    expect(resolvePath(parsePath('body.items[+].active'), obj)).toEqual({
      kind: 'collection',
      op: 'all',
      values: [true, true, false],
    })
  })

  it('resolves none operator', () => {
    expect(resolvePath(parsePath('body.items[-].deleted'), obj)).toEqual({
      kind: 'collection',
      op: 'none',
      values: [false, false, true],
    })
  })

  it('throws when collection target is not an array', () => {
    expect(() => resolvePath(parsePath('body.user[*].x'), obj)).toThrow('body.user')
  })
})
