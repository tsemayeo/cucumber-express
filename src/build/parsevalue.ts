import type { ScenarioWorld } from '../world/index.js'

const TYPE_PREFIX_REGEX = /^\((int|float|boolean|string)\) (.*)/s
const LOOKUP_REGEX      = /^<(?!env:)([^>]+)>$/
const ENV_TOKEN_REGEX   = /^<env:([A-Z0-9_]+)>$/

export function parseValue(raw: string, world?: ScenarioWorld): unknown {
  const typeMatch = TYPE_PREFIX_REGEX.exec(raw)
  const type      = typeMatch ? typeMatch[1] : 'string'
  const valueStr  = typeMatch ? typeMatch[2] : raw

  if (valueStr === '<null>')  return null
  if (valueStr === '<empty>') return []

  const lookupMatch = LOOKUP_REGEX.exec(valueStr)
  const envMatch    = ENV_TOKEN_REGEX.exec(valueStr)
  let resolved: string

  if (lookupMatch) {
    const key = lookupMatch[1]
    if (!world) throw new Error(`Lookup "<${key}>" used but no world provided`)
    const captured = world.captures.get(key)
    if (captured === undefined) throw new Error(`Lookup "<${key}>" not found in world.captures`)
    resolved = captured
  } else if (envMatch) {
    const varName = envMatch[1]
    const val     = process.env[varName]
    if (val === undefined) throw new Error(`Missing environment variable "${varName}"`)
    resolved = val
  } else {
    resolved = valueStr
  }

  switch (type) {
    case 'int':     return parseInt(resolved, 10)
    case 'float':   return parseFloat(resolved)
    case 'boolean': return resolved === 'true'
    default:        return resolved
  }
}
