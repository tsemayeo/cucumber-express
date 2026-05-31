import type { DataTable } from '@cucumber/cucumber'
import type { ScenarioWorld } from '../world/index.js'
import { evaluate } from './evaluate.js'
import { validatePath, validateAssertValue } from '../util/syntax.js'

export function assertResponse(dataTable: DataTable, responseObject: unknown, world?: ScenarioWorld): void {
  const syntaxErrors = dataTable.raw().flatMap(([path, value]) => [
    validatePath(path),
    validateAssertValue(value),
  ]).filter((e): e is string => e !== null)
  if (syntaxErrors.length > 0) throw new Error(syntaxErrors.join('\n'))

  const failures = dataTable.raw()
    .map(([path, expected]) => evaluate(path, expected, responseObject, world))
    .filter((result): result is string => result !== null)
  if (failures.length > 0) throw new Error(failures.join('\n'))
}
