import type { SchemaDefinition, SchemaRow, SchemaValueToken } from './types.js'
import { SCHEMA_HEADER_RE, TABLE_ROW_RE } from './patterns.js'

const FAKER_REGEX    = /^\(faker\)\s+([a-zA-Z]+\.[a-zA-Z]+)(?:\(([^)]*)\))?\s*$/
const ENV_REGEX      = /^<env:([A-Z0-9_]+)>$/

function parseValue(raw: string): SchemaValueToken {

   const envMatch = ENV_REGEX.exec(raw)

  if (raw.startsWith('(faker)')) {
    const m = FAKER_REGEX.exec(raw)!
    if (m[2] !== undefined && m[2] !== '') {
      const n = Number(m[2])
      return { kind: 'faker', path: m[1], arg: isNaN(n) ? m[2] : n }
    }
    return { kind: 'faker', path: m[1] }
  } else if (raw.startsWith('(schema)')) {
    return { kind: 'schema', name: raw.slice('(schema)'.length).trim() }
  } else if (raw.startsWith('(array')) {
    const m = /^\(array(?::(\d+))?\)\s*(.*)/.exec(raw)!
    const count      = m[1] !== undefined ? Number(m[1]) : undefined
    const itemSchema = m[2].trim() || undefined
    return count !== undefined
      ? { kind: 'array', itemSchema, count }
      : { kind: 'array', itemSchema }
  } else if (envMatch) {
    return { kind: 'env', name: envMatch[1] }
  } else {
    return { kind: 'literal', value: raw }
  }
}

function parseRow(trimmed: string): SchemaRow {
  const cols = trimmed.split('|').map(c => c.trim()).filter(Boolean)
  const [path, value] = cols
  if (path === '(extends)') return { kind: 'extends', baseName: value }
  return { kind: 'field', path, value: parseValue(value) }
}

export function parseSchemaFile(content: string, fileName: string): SchemaDefinition[] {
  const definitions: SchemaDefinition[] = []
  let current: SchemaDefinition | null = null

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    const headerMatch = SCHEMA_HEADER_RE.exec(trimmed)

    if (headerMatch) {
      if (current) definitions.push(current)
      current = { name: headerMatch[1].trim(), fileName, rows: [] }
    } else if (trimmed === '' && current !== null) {
      definitions.push(current)
      current = null
    } else if (TABLE_ROW_RE.test(trimmed) && current !== null) {
      current.rows.push(parseRow(trimmed))
    }
  }

  if (current) definitions.push(current)

  return definitions
}
