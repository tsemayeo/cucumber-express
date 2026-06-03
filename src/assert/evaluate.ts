import type { ResolveResult } from './types.js'
import type { ScenarioWorld } from '../world/index.js'
import { parsePath } from '../util/parse.js'
import { resolvePath } from './resolve.js'

const CAPTURE_PLAIN_REGEX = /^\{([^}:/]+)\}$/
const CAPTURE_GATE_REGEX  = /^\{([^}:/]+):\/(.+)\/\}$/
const LOOKUP_REGEX        = /^<(?!null>|present>|empty>)([^>]+)>$/
const REGEX_ASSERT_REGEX  = /^\/(.+)\/$/

function handleCapturePlain(expected: string, result: ResolveResult, world?: ScenarioWorld): null {
  if (!world) throw new Error(`Capture "${expected}" used but no world provided`)
  const key = CAPTURE_PLAIN_REGEX.exec(expected)![1]
  if (result.kind === 'value') world.captures.set(key, String(result.value))
  return null
}

function handleCaptureGate(path: string, expected: string, result: ResolveResult, world?: ScenarioWorld): string | null {
  if (!world) throw new Error(`Capture "${expected}" used but no world provided`)
  const [, key, pattern] = CAPTURE_GATE_REGEX.exec(expected)!
  const sv = result.kind === 'value' ? String(result.value) : ''
  const match = new RegExp(pattern).exec(sv)
  if (!match) return `[${path}] expected to match ${expected}, got "${sv}"`
  world.captures.set(key, match[1] !== undefined ? match[1] : sv)
  return null
}

function resolveLookup(expected: string, world?: ScenarioWorld): string {
  const key = LOOKUP_REGEX.exec(expected)![1]
  if (!world) throw new Error(`Lookup "${expected}" used but no world provided`)
  const value = world.captures.get(key)
  if (value === undefined) throw new Error(`Lookup "${expected}" not found in world.captures`)
  return value
}

function matches(value: unknown, expected: string): boolean {
  if (expected === '<null>')    return value === null
  if (expected === '<present>') return value !== null && value !== undefined
  if (expected === '<empty>')   return Array.isArray(value) && value.length === 0
  const regexMatch = REGEX_ASSERT_REGEX.exec(expected)
  if (regexMatch) return new RegExp(regexMatch[1]).test(String(value))
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
  const result = resolvePath(parsePath(path), rootObject)

  if (CAPTURE_PLAIN_REGEX.test(expected)) return handleCapturePlain(expected, result, world)
  if (CAPTURE_GATE_REGEX.test(expected))  return handleCaptureGate(path, expected, result, world)

  const resolved = LOOKUP_REGEX.test(expected) ? resolveLookup(expected, world) : expected

  if (evaluateRow(result, resolved)) return null

  if (result.kind === 'value') {
    return `[${path}] expected "${resolved}", got "${String(result.value)}"`
  }

  const received = result.values.map(v => `"${String(v)}"`).join(', ')
  return `[${path}] expected ${result.op} to equal "${resolved}", got [${received}]`
}
