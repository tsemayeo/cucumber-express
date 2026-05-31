import type { DataTable } from '@cucumber/cucumber'
import type { ScenarioWorld } from '../world/index.js'
import { parsePath } from '../util/parse.js'
import { setPath } from './setpath.js'
import { parseValue } from './parsevalue.js'
import { validatePath, validateBuildValue } from '../util/syntax.js'

export function buildRequest<T extends object>(
  schema: () => T,
  table:  DataTable,
  world?: ScenarioWorld,
): T {
  const syntaxErrors = table.raw().flatMap(([path, value]) => [
    validatePath(path),
    validateBuildValue(value),
  ]).filter((e): e is string => e !== null)
  if (syntaxErrors.length > 0) throw new Error(syntaxErrors.join('\n'))

  const obj = schema()
  for (const [path, raw] of table.raw()) {
    setPath(parsePath(path), obj, parseValue(raw, world))
  }
  return obj
}
