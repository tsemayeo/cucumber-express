import type { ScenarioWorld } from '../world/index.js'

const TYPE_PREFIX_REGEX = /^\((int|float|boolean|string)\) (.*)/s
const LOOKUP_REGEX      = /^<([^>]+)>$/

export function parseValue(raw: string, world?: ScenarioWorld): unknown {
  const typeMatch = TYPE_PREFIX_REGEX.exec(raw)
  const type      = typeMatch ? typeMatch[1] : 'string'
  const valueStr  = typeMatch ? typeMatch[2] : raw

  const lookupMatch = LOOKUP_REGEX.exec(valueStr)
  let resolved: string

  if (lookupMatch) {
    const key = lookupMatch[1]
    if (key === 'null')  return null
    if (key === 'empty') return []
    if (!world) throw new Error(`Lookup "<${key}>" used but no world provided`)
    const captured = world.captures.get(key)
    if (captured === undefined) throw new Error(`Lookup "<${key}>" not found in world.captures`)
    resolved = captured
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
