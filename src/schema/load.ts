import { readFile, glob } from 'node:fs/promises'
import { validateSchemaFile, validateRegistry } from './validate.js'
import { parseSchemaFile } from './parse.js'
import { SchemaRegistry } from './registry.js'

export async function loadSchemas(pattern: string): Promise<SchemaRegistry> {
  const files: string[] = []
  for await (const f of glob(pattern)) files.push(f)

  if (files.length === 0) {
    return new SchemaRegistry()
  }

  const contents: { file: string; content: string }[] = await Promise.all(files.map(f => readFile(f, 'utf8').then(c => ({ file: f, content: c }))))

  const structuralErrors = contents.flatMap(({ file, content }) => validateSchemaFile(content, file))
  if (structuralErrors.length > 0)
    throw new Error(structuralErrors.map(e => e.message).join('\n'))

  const allDefs = contents.flatMap(({ file, content }) => parseSchemaFile(content, file))

  const semanticErrors = validateRegistry(allDefs)
  if (semanticErrors.length > 0)
    throw new Error(semanticErrors.map(e => e.message).join('\n'))

  const registry = new SchemaRegistry()
  for (const def of allDefs) registry.register(def.name, def)
  return registry
}
