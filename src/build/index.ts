import type { DataTable } from '@cucumber/cucumber'
import type { ScenarioWorld } from '../world/index.js'
import { parsePath } from '../util/parse.js'
import { setPath } from './setpath.js'
import { parseValue } from './parsevalue.js'
import { validatePath, validateBuildValue, validateBuildPathFromSchema, validateBuildValueFromSchema } from '../util/syntax.js'
import { autoConstructItems, applyArrayCount } from './schema.js'

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

export function buildFromSchema(
  name:  string,
  table: DataTable,
  world: ScenarioWorld,
): unknown {
  if (!world?.schemas) throw new Error('buildFromSchema requires a world with a schema registry')

  const syntaxErrors = table.raw().flatMap(([path, value]) => [
    validateBuildPathFromSchema(path),
    validateBuildValueFromSchema(value),
  ]).filter((e): e is string => e !== null)
  if (syntaxErrors.length > 0) throw new Error(syntaxErrors.join('\n'))

  const obj = world.schemas.build(name) as Record<string, unknown>

  for (const [path, raw] of table.raw()) {
    const segments = parsePath(path)
    autoConstructItems(segments, obj, world.schemas)
    const match = /^\(array:(\d+)\)$/.exec(raw)
    if (match) {
      applyArrayCount(segments, obj, Number(match[1]), world.schemas)
    } else {
      setPath(segments, obj, parseValue(raw, world))
    }
  }
  return obj
}
