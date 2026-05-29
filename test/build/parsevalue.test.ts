import { describe, it, expect } from 'vitest'
import { parseValue } from '../../src/build/parsevalue.js'
import { ScenarioWorld } from '../../src/world/index.js'

describe('parseValue — bare string', () => {
  it('returns the raw string when no prefix or lookup', () => {
    expect(parseValue('hello')).toBe('hello')
  })
})

describe('parseValue — type casting', () => {
  it('(int) casts to number', () => {
    expect(parseValue('(int) 30')).toBe(30)
  })

  it('(float) casts to number', () => {
    expect(parseValue('(float) 9.99')).toBe(9.99)
  })

  it('(boolean) true casts to true', () => {
    expect(parseValue('(boolean) true')).toBe(true)
  })

  it('(boolean) false casts to false', () => {
    expect(parseValue('(boolean) false')).toBe(false)
  })

  it('(string) prefix returns string as-is', () => {
    expect(parseValue('(string) hello')).toBe('hello')
  })
})

describe('parseValue — world lookup', () => {
  it('resolves <key> from world.captures', () => {
    const world = new ScenarioWorld()
    world.captures.set('userId', 'abc-123')
    expect(parseValue('<userId>', world)).toBe('abc-123')
  })

  it('throws when key not in captures', () => {
    const world = new ScenarioWorld()
    expect(() => parseValue('<missing>', world)).toThrow('<missing>')
  })

  it('throws when no world is provided', () => {
    expect(() => parseValue('<userId>')).toThrow('no world provided')
  })
})

describe('parseValue — combined cast + lookup', () => {
  it('(int) <key> looks up then casts to int', () => {
    const world = new ScenarioWorld()
    world.captures.set('count', '5')
    expect(parseValue('(int) <count>', world)).toBe(5)
  })

  it('(boolean) <key> looks up then casts to boolean', () => {
    const world = new ScenarioWorld()
    world.captures.set('flag', 'true')
    expect(parseValue('(boolean) <flag>', world)).toBe(true)
  })
})
