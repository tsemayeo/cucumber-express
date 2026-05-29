import type { DataTable } from '@cucumber/cucumber'
import type { ScenarioWorld } from '../world/index.js'
import { evaluate } from './evaluate.js'

export function validateResponse(dataTable: DataTable, responseObject: unknown, world?: ScenarioWorld): void {
  const failures = dataTable.raw()
    .map(([path, expected]) => evaluate(path, expected, responseObject, world))
    .filter((result): result is string => result !== null)

  if (failures.length > 0) {
    throw new Error(failures.join('\n'))
  }
}
