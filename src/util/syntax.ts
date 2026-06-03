const TYPE_PREFIX_REGEX = /^\((int|float|boolean|string)\) (.*)/s
const LOOKUP_REGEX      = /^<([^>]+)>$/
const REGEX_ASSERT_REGEX = /^\/(.+)\/$/
const CAPTURE_GATE_REGEX = /^\{([^}:/]+):\/(.+)\/\}$/
const CAPTURE_GATE_ATTEMPT_REGEX = /^\{[^}:/]+:\//

function isValidRegex(pattern: string): boolean {
  try { new RegExp(pattern); return true } catch { return false }
}

export function validatePath(path: string): string | null {
  if (path === '')           return `Invalid path "": path must not be empty`
  if (path.startsWith('.'))  return `Invalid path "${path}": must not start with a dot`
  if (path.endsWith('.'))    return `Invalid path "${path}": must not end with a dot`
  if (path.includes('..'))   return `Invalid path "${path}": must not contain consecutive dots`

  const tokens = path.match(/[^.[\]]+|\[[^\]]*\]/g) ?? []

  for (const token of tokens) {
    if (!token.startsWith('[')) continue

    const inner = token.slice(1, -1)
    if (inner === '*' || inner === '+' || inner === '-') continue
    if (inner === '') return `Invalid path "${path}": empty brackets [] are not valid (use [0], [*], [+], or [-])`

    const idx = Number(inner)
    if (Number.isInteger(idx) && idx >= 0) continue

    return `Invalid path "${path}": invalid array operator [${inner}]`
  }

  return null
}

export function validateAssertValue(value: string): string | null {
  const regexAssert = REGEX_ASSERT_REGEX.exec(value)
  if (regexAssert) {
    if (!isValidRegex(regexAssert[1])) {
      return `Invalid value "${value}": invalid regex pattern`
    }
    return null
  }

  const captureGate = CAPTURE_GATE_REGEX.exec(value)
  if (captureGate) {
    if (!isValidRegex(captureGate[2])) {
      return `Invalid value "${value}": invalid regex pattern in capture gate`
    }
    return null
  }

  if (CAPTURE_GATE_ATTEMPT_REGEX.test(value)) {
    return `Invalid value "${value}": malformed capture gate, expected {key:/pattern/}`
  }

  return null
}

export function validateBuildValue(value: string): string | null {
  const typeMatch = TYPE_PREFIX_REGEX.exec(value)
  if (!typeMatch) return null

  const [, type, valueStr] = typeMatch
  if (valueStr === '<null>' || valueStr === '<empty>') {
    return `Invalid value "${value}": "${valueStr}" is a reserved token and cannot be combined with a type cast prefix`
  }
  if (LOOKUP_REGEX.test(valueStr)) return null

  switch (type) {
    case 'int': {
      if (isNaN(parseInt(valueStr, 10))) {
        return `Invalid value "${value}": "${valueStr}" is not a valid integer`
      }
      return null
    }
    case 'float': {
      const n = parseFloat(valueStr)
      if (isNaN(n) || !isFinite(n)) {
        return `Invalid value "${value}": "${valueStr}" is not a valid number`
      }
      return null
    }
    case 'boolean': {
      if (valueStr !== 'true' && valueStr !== 'false') {
        return `Invalid value "${value}": expected "true" or "false", got "${valueStr}"`
      }
      return null
    }
    default:
      return null
  }
}
