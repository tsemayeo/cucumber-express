import type { SchemaDefinition, SchemaRow, SchemaValueToken } from './types.js'
import { SCHEMA_HEADER_RE, TABLE_ROW_RE } from './patterns.js'

const FAKER_RE = /^\(faker\)\s+([a-zA-Z]+\.[a-zA-Z]+)(?:\(([^)]*)\))?\s*$/

function parseValue(raw: string): SchemaValueToken {
  if (raw.startsWith('(faker)')) {
    const m = FAKER_RE.exec(raw)!
    if (m[2] !== undefined && m[2] !== '') {
      const n = Number(m[2])
      return { kind: 'faker', path: m[1], arg: isNaN(n) ? m[2] : n }
    }
    return { kind: 'faker', path: m[1] }
  }

  if (raw.startsWith('(schema)')) {
    return { kind: 'schema', name: raw.slice('(schema)'.length).trim() }
  }

  if (raw.startsWith('(array)')) {
    const name = raw.slice('(array)'.length).trim()
    return name ? { kind: 'array', itemSchema: name } : { kind: 'array' }
  }

  return { kind: 'literal', value: raw }
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
