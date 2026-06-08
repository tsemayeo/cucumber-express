import type { SchemaRegistry } from '../schema/registry.js'
import { loadSchemas } from '../schema/load.js'

export class ScenarioWorld {
  captures = new Map<string, string>()
  schemas?: SchemaRegistry
  request: unknown = null
  response: unknown = null

  static async withSchemas(pattern: string): Promise<typeof ScenarioWorld> {
    const registry = await loadSchemas(pattern)
    return class extends ScenarioWorld {
      schemas = registry
    }
  }
}
