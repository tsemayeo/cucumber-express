import { describe, it, expect } from 'vitest'
import { ScenarioWorld } from '../../src/world/index.js'

describe('ScenarioWorld', () => {
  it('captures is empty on construction', () => {
    const world = new ScenarioWorld()
    expect(world.captures.size).toBe(0)
  })

  it('set and get a capture value', () => {
    const world = new ScenarioWorld()
    world.captures.set('userId', 'abc-123')
    expect(world.captures.get('userId')).toBe('abc-123')
  })
})
