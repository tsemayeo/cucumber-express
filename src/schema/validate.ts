import type { SchemaDefinition, ValidationError } from './types.js'
import { SCHEMA_HEADER_RE, TABLE_ROW_RE } from './patterns.js'
const IDENTIFIER_RE        = /^[\w$]+$/
const RECOGNIZED_PREFIX_RE = /^\((?:int|float|boolean|string|faker|schema|extends|array)\)/
const FAKER_SYNTAX_RE      = /^\(faker\)\s+[a-zA-Z]+\.[a-zA-Z]+(?:\([^)]*\))?\s*$/

type ParseState = {
  currentSchema: string | null
  schemaLine:    number
  extendsCount:  number
  rowCount:      number
}

function makeError(fileName: string, message: string, line?: number, schemaName?: string): ValidationError {
  const error: ValidationError = { fileName, message }
  if (line !== undefined) error.line = line
  if (schemaName)         error.schemaName = schemaName
  return error
}

function validateSchemaName(name: string): string | null {
  if (!name) return 'Schema name cannot be empty'
  if (!IDENTIFIER_RE.test(name)) return `Schema name "${name}" is invalid — must contain only letters, digits, _ or $`
  return null
}

function validateExtendsValue(value: string): string | null {
  if (!value || !IDENTIFIER_RE.test(value)) return `(extends) requires a valid schema name, got "${value}"`
  return null
}

function validateValue(value: string): string | null {
  if (!value.startsWith('(')) return null
  if (!RECOGNIZED_PREFIX_RE.test(value)) {
    const match = /^\(([^)]*)\)/.exec(value)
    return `Unrecognised prefix "(${match?.[1] ?? ''})" — valid prefixes are: int, float, boolean, string, faker, schema, extends, array`
  }
  if (value.startsWith('(faker)') && !FAKER_SYNTAX_RE.test(value)) {
    return `Invalid (faker) syntax "${value}" — expected "(faker) namespace.method" or "(faker) namespace.method(arg)"`
  }
  if (value.startsWith('(schema)')) {
    const name = value.slice('(schema)'.length).trim()
    if (!name || !IDENTIFIER_RE.test(name)) return `(schema) name "${name}" is invalid — must contain only letters, digits, _ or $`
  }
  if (value.startsWith('(array)')) {
    const name = value.slice('(array)'.length).trim()
    if (name && !IDENTIFIER_RE.test(name)) return `(array) item type "${name}" is invalid — must contain only letters, digits, _ or $`
  }
  return null
}

function processHeader(name: string, lineNum: number, fileName: string, state: ParseState): ValidationError[] {
  const errors: ValidationError[] = []
  const msg = validateSchemaName(name)
  if (msg) {
    errors.push(makeError(fileName, msg, lineNum))
    state.currentSchema = null
  } else {
    state.currentSchema = name
    state.schemaLine    = lineNum
    state.extendsCount  = 0
    state.rowCount      = 0
  }
  return errors
}

function processTableRow(trimmed: string, lineNum: number, fileName: string, state: ParseState): ValidationError[] {
  const errors: ValidationError[] = []
  state.rowCount++

  const cols = trimmed.split('|').map(c => c.trim()).filter(Boolean)
  if (cols.length !== 2) {
    errors.push(makeError(fileName, `Expected 2 columns, got ${cols.length}`, lineNum, state.currentSchema!))
    return errors
  }

  const [path, value] = cols

  if (path === '(extends)') {
    state.extendsCount++
    if (state.extendsCount > 1) {
      errors.push(makeError(fileName, `Schema "${state.currentSchema}" has more than one (extends) row`, lineNum, state.currentSchema!))
    }
    const msg = validateExtendsValue(value)
    if (msg) errors.push(makeError(fileName, msg, lineNum, state.currentSchema!))
    return errors
  }

  const msg = validateValue(value)
  if (msg) errors.push(makeError(fileName, msg, lineNum, state.currentSchema!))
  return errors
}

export function validateSchemaFile(content: string, fileName: string): ValidationError[] {
  const state: ParseState = { currentSchema: null, schemaLine: 0, extendsCount: 0, rowCount: 0 }
  const errors: ValidationError[] = []

  for (const [i, line] of content.split('\n').entries()) {
    const lineNum = i + 1
    const trimmed = line.trim()
    const headerMatch = SCHEMA_HEADER_RE.exec(trimmed)

    if (state.currentSchema !== null && state.rowCount === 0 && (headerMatch !== null || trimmed === ''))
      errors.push(makeError(fileName, `Schema "${state.currentSchema}" has no data table rows`, state.schemaLine, state.currentSchema))

    if (headerMatch) {
      errors.push(...processHeader(headerMatch[1].trim(), lineNum, fileName, state))
    } else if (trimmed === '' && state.currentSchema !== null) {
      state.currentSchema = null
    } else if (TABLE_ROW_RE.test(trimmed) && state.currentSchema !== null) {
      errors.push(...processTableRow(trimmed, lineNum, fileName, state))
    }
  }

  if (state.currentSchema !== null && state.rowCount === 0) {
    errors.push(makeError(fileName, `Schema "${state.currentSchema}" has no data table rows`, state.schemaLine, state.currentSchema))
  }

  return errors
}

function checkDuplicateNames(definitions: SchemaDefinition[]): { allNames: Set<string>, errors: ValidationError[] } {
  const errors: ValidationError[] = []
  const nameToFile = new Map<string, string>()
  for (const def of definitions) {
    if (nameToFile.has(def.name)) {
      errors.push({ fileName: def.fileName, schemaName: def.name, message: `Duplicate schema name "${def.name}" — also defined in "${nameToFile.get(def.name)}"` })
    } else {
      nameToFile.set(def.name, def.fileName)
    }
  }
  return { allNames: new Set(nameToFile.keys()), errors }
}

function checkUnresolvableRefs(definitions: SchemaDefinition[], allNames: Set<string>): { brokenSchemas: Set<string>, errors: ValidationError[] } {
  const errors: ValidationError[] = []
  const brokenSchemas = new Set<string>()
  for (const def of definitions) {
    for (const row of def.rows) {
      if (row.kind === 'extends') {
        if (!allNames.has(row.baseName)) {
          errors.push({ fileName: def.fileName, schemaName: def.name, message: `(extends) references unknown schema "${row.baseName}"` })
          brokenSchemas.add(def.name)
        }
      } else if (row.kind === 'field') {
        if (row.value.kind === 'schema' && !allNames.has(row.value.name)) {
          errors.push({ fileName: def.fileName, schemaName: def.name, message: `(schema) at "${row.path}" references unknown schema "${row.value.name}"` })
          brokenSchemas.add(def.name)
        } else if (row.value.kind === 'array' && row.value.itemSchema && !allNames.has(row.value.itemSchema)) {
          errors.push({ fileName: def.fileName, schemaName: def.name, message: `(array) at "${row.path}" references unknown schema "${row.value.itemSchema}"` })
          brokenSchemas.add(def.name)
        }
      }
    }
  }
  return { brokenSchemas, errors }
}

function checkCycles(definitions: SchemaDefinition[], brokenSchemas: Set<string>): ValidationError[] {
  const adj = new Map<string, string[]>()
  for (const def of definitions) {
    if (brokenSchemas.has(def.name)) continue
    const refs: string[] = []
    for (const row of def.rows) {
      if (row.kind === 'extends') {
        refs.push(row.baseName)
      } else if (row.kind === 'field') {
        if (row.value.kind === 'schema') refs.push(row.value.name)
        else if (row.value.kind === 'array' && row.value.itemSchema) refs.push(row.value.itemSchema)
      }
    }
    adj.set(def.name, refs.filter(r => !brokenSchemas.has(r)))
  }
  const cycle = detectCycle(adj)
  if (!cycle) return []
  const filePath = definitions.find(d => d.name === cycle[0])?.fileName ?? ''
  return [{ fileName: filePath, schemaName: cycle[0], message: `Circular schema reference: ${cycle.join(' → ')}` }]
}

export function validateRegistry(definitions: SchemaDefinition[]): ValidationError[] {
  const { allNames, errors } = checkDuplicateNames(definitions)
  const { brokenSchemas, errors: refErrors } = checkUnresolvableRefs(definitions, allNames)
  errors.push(...refErrors, ...checkCycles(definitions, brokenSchemas))
  return errors
}

function detectCycle(adj: Map<string, string[]>): string[] | null {
  const visited = new Set<string>()
  const stack   = new Set<string>()

  function dfs(node: string, path: string[]): string[] | null {
    if (stack.has(node)) {
      const start = path.indexOf(node)
      return [...path.slice(start), node]
    }
    if (visited.has(node)) return null
    visited.add(node)
    stack.add(node)
    for (const neighbour of adj.get(node) ?? []) {
      const cycle = dfs(neighbour, [...path, node])
      if (cycle) return cycle
    }
    stack.delete(node)
    return null
  }

  for (const node of adj.keys()) {
    const cycle = dfs(node, [])
    if (cycle) return cycle
  }
  return null
}
