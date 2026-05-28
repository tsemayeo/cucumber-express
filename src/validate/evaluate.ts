import type { ResolveResult } from './types.js'
import type { ScenarioWorld } from '../world/index.js'
import { parsePath } from './parse.js'
import { resolvePath } from './resolve.js'

const CAPTURE_REGEX = /^\{([^}]+)\}$/

function resolveCapture(expected: string, world?: ScenarioWorld): string {
  const match = CAPTURE_REGEX.exec(expected)
  if (!match) return expected
  const key = match[1]
  if (!world) throw new Error(`Capture "${expected}" used but no world provided`)
  const value = world.captures.get(key)
  if (value === undefined) throw new Error(`Capture "${expected}" not found in world.captures`)
  return value
}

function matches(value: unknown, expected: string): boolean {
  if (expected === '<null>')    return value === null
  if (expected === '<present>') return value !== null && value !== undefined
  return String(value) === expected
}

export function evaluateRow(result: ResolveResult, expected: string): boolean {
  if (result.kind === 'value') {
    return matches(result.value, expected)
  }

  const { op, values } = result
  switch (op) {
    case 'some': return values.some(v => matches(v, expected))
    case 'all':  return values.every(v => matches(v, expected))
    case 'none': return values.every(v => !matches(v, expected))
  }
}

export function evaluate(path: string, expected: string, rootObject: unknown, world?: ScenarioWorld): string | null {
  const resolved = resolveCapture(expected, world)
  const result = resolvePath(parsePath(path), rootObject)

  if (evaluateRow(result, resolved)) return null

  if (result.kind === 'value') {
    return `[${path}] expected "${resolved}", got "${String(result.value)}"`
  }

  const received = result.values.map(v => `"${String(v)}"`).join(', ')
  return `[${path}] expected ${result.op} to equal "${resolved}", got [${received}]`
}
