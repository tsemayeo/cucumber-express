import type { Segment } from '../util/types.js'

function navigateKey(
  object: unknown,
  key: string,
  path: string,
  nextKind: Segment['kind'],
): { current: unknown; path: string } {
  if (typeof object !== 'object' || object === null || Array.isArray(object)) {
    throw new Error(`Expected object at "${path}", got ${Array.isArray(object) ? 'array' : typeof object}`)
  }
  const record = object as Record<string, unknown>
  const nextPath = path ? `${path}.${key}` : key
  if (record[key] === undefined || record[key] === null) {
    record[key] = nextKind === 'index' ? [] : {}
  }
  return { current: record[key], path: nextPath }
}

function navigateIndex(
  object: unknown,
  index: number,
  path: string,
): { current: unknown; path: string } {
  if (!Array.isArray(object)) {
    throw new Error(`Expected array at "${path}", got ${typeof object}`)
  }
  if (object[index] === undefined) {
    throw new Error(`Index ${index} out of bounds at "${path}" (length: ${object.length})`)
  }
  return { current: object[index], path: `${path}[${index}]` }
}

function assignKey(object: unknown, key: string, path: string, value: unknown): void {
  if (typeof object !== 'object' || object === null || Array.isArray(object)) {
    throw new Error(`Expected object at "${path}", got ${Array.isArray(object) ? 'array' : typeof object}`)
  }
  ;(object as Record<string, unknown>)[key] = value
}

function assignIndex(object: unknown, index: number, path: string, value: unknown): void {
  if (!Array.isArray(object)) {
    throw new Error(`Expected array at "${path}", got ${typeof object}`)
  }
  if (object[index] === undefined) {
    throw new Error(`Index ${index} out of bounds at "${path}" (length: ${object.length})`)
  }
  object[index] = value
}

export function setPath(segments: Segment[], obj: unknown, value: unknown): void {
  if (segments.length === 0) return

  let current: unknown = obj
  let path = ''

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]
    const next = segments[i + 1]

    switch (seg.kind) {
      case 'key':   ({ current, path } = navigateKey(current, seg.value, path, next.kind)); break
      case 'index': ({ current, path } = navigateIndex(current, seg.index, path));          break
      default: throw new Error(`Collection operators ([*], [+], [-]) are not supported when writing`)
    }
  }

  const last = segments[segments.length - 1]

  switch (last.kind) {
    case 'key':   assignKey(current, last.value, path, value); break
    case 'index': assignIndex(current, last.index, path, value); break
    default: throw new Error(`Collection operators ([*], [+], [-]) are not supported when writing`)
  }
}
