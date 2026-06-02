import { describe, it, expect } from 'vitest'
import { ScenarioWorld } from '../../src/world/index.js'
import { SchemaRegistry } from '../../src/schema/registry.js'

describe('ScenarioWorld.withSchemas', () => {
  it('registry is shared across instances', async () => {
    const WorldClass = await ScenarioWorld.withSchemas('test/schema/fixtures/valid.feature')
    const a = new WorldClass()
    const b = new WorldClass()
    expect(a.schemas).toBeDefined()
    expect(a.schemas).toBe(b.schemas)
  })

  it('captures is still present on instances', async () => {
    const WorldClass = await ScenarioWorld.withSchemas('test/schema/fixtures/valid.feature')
    const world = new WorldClass()
    expect(world.captures).toBeInstanceOf(Map)
    expect(world.captures.size).toBe(0)
  })

  it('empty glob returns without error', async () => {
    const WorldClass = await ScenarioWorld.withSchemas('test/schema/fixtures/nonexistent/**')
    expect(new WorldClass().schemas).toBeInstanceOf(SchemaRegistry)
  })
})
