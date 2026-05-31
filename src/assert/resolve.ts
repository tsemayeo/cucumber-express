import type { Segment } from '../util/types.js'
import type { ResolveResult } from './types.js'

function resolveKey(object: unknown, key: string, path: string): { value: unknown; path: string } {
  if (typeof object !== 'object' || object === null || Array.isArray(object)) {
    throw new Error(`Expected object at "${path}", got ${Array.isArray(object) ? 'array' : typeof object}`)
  }
  if (!(key in (object as Record<string, unknown>))) {
    throw new Error(`Key "${key}" not found at "${path}"`)
  }
  return {
    value: (object as Record<string, unknown>)[key],
    path: path ? `${path}.${key}` : key,
  }
}

function resolveIndex(object: unknown, index: number, path: string): { value: unknown; path: string } {
  if (!Array.isArray(object)) {
    throw new Error(`Expected array at "${path}", got ${typeof object}`)
  }
  if (index < 0 || index >= object.length) {
    throw new Error(`Index ${index} out of bounds at "${path}" (length: ${object.length})`)
  }
  return {
    value: object[index],
    path: `${path}[${index}]`,
  }
}

function resolveCollection(
  object: unknown,
  op: 'some' | 'all' | 'none',
  remaining: Segment[],
  path: string,
): ResolveResult {
  if (!Array.isArray(object)) {
    throw new Error(`Expected array at "${path}", got ${typeof object}`)
  }
  const values = object.map((el, idx) => {
    const result = resolvePath(remaining, el, `${path}[${idx}]`)
    return result.kind === 'value' ? result.value : undefined
  })
  return { kind: 'collection', op, values }
}

export function resolvePath(segments: Segment[], obj: unknown, _path = ''): ResolveResult {
  let object: unknown = obj
  let path = _path

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]

    switch (seg.kind) {
      case 'key': {
        const next = resolveKey(object, seg.value, path)
        object = next.value
        path = next.path
        break
      }
      case 'index': {
        const next = resolveIndex(object, seg.index, path)
        object = next.value
        path = next.path
        break
      }
      case 'some':
      case 'all':
      case 'none':
        return resolveCollection(object, seg.kind, segments.slice(i + 1), path)
    }
  }

  return { kind: 'value', value: object }
}
