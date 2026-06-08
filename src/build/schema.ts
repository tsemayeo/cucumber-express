import type { SchemaRegistry } from '../schema/registry.js'
import type { Segment } from '../util/types.js'

// Pre-pass before setPath: walks the path and appends a schema-built item to any typed
// array whose next index would be out of bounds. Bails silently on bad state so setPath
// can throw its own descriptive error.
export function autoConstructItems(
  segments: Segment[],
  obj: unknown,
  registry: SchemaRegistry,
): void {
  let current: unknown = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const seg  = segments[i]
    const next = segments[i + 1]

    // Advance current by one segment; bail if the structure doesn't match
    if (seg.kind === 'key' && (typeof current !== 'object' || current === null || Array.isArray(current))) {
       return 
    }

    if (seg.kind === 'index' && !Array.isArray(current)) { 
      return 
    }

    current = seg.kind === 'key' ? (current as Record<string, unknown>)[seg.value] : (current as unknown[])[seg.index]

    // Look ahead: if the next step is an OOB index on a typed array, fill up to that index
    if (next.kind === 'index' && Array.isArray(current) && next.index >= (current as unknown[]).length) {
      const itemSchema = (current as any).__itemSchema as string | undefined
      const arr = current as unknown[]
      while (itemSchema && arr.length <= next.index) {
        arr.push(registry.build(itemSchema))
      }
      // untyped array — setPath will throw the OOB error
    }
  }
}

// Replaces the target array field with `count` freshly built items.
// Preserves __itemSchema so subsequent index overrides can still auto-construct.
export function applyArrayCount(
  segments: Segment[],
  obj: Record<string, unknown>,
  count: number,
  registry: SchemaRegistry,
): void {
  // Navigate to the parent of the target field
  let parent: unknown = obj
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    if (seg.kind === 'key')        parent = (parent as Record<string, unknown>)[seg.value]
    else if (seg.kind === 'index') parent = (parent as unknown[])[seg.index]
  }

  const last = segments[segments.length - 1] as { kind: 'key'; value: string }

  const arr = (parent as Record<string, unknown>)[last.value]

  if (!Array.isArray(arr))
    throw new Error(`(array:N) is only valid for array fields, got ${typeof arr}`)

  const itemSchema = (arr as any).__itemSchema as string | undefined
  if (!itemSchema)
    throw new Error(`(array:${count}) requires a typed array (no item schema found)`)

  const newArr: unknown[] = count > 0
    ? Array.from({ length: count }, () => registry.build(itemSchema!))
    : []
  if (itemSchema) Object.assign(newArr, { __itemSchema: itemSchema });
  
  (parent as Record<string, unknown>)[last.value] = newArr
}
