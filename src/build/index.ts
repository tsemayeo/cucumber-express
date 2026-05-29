import type { DataTable } from '@cucumber/cucumber'
import type { ScenarioWorld } from '../world/index.js'
import { parsePath } from '../util/parse.js'
import { setPath } from './setpath.js'
import { parseValue } from './parsevalue.js'

export function buildRequest<T extends object>(
  schema: () => T,
  table:  DataTable,
  world?: ScenarioWorld,
): T {
  const obj = schema()
  for (const [path, raw] of table.raw()) {
    setPath(parsePath(path), obj, parseValue(raw, world))
  }
  return obj
}
