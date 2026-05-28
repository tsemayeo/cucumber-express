import type { Segment } from './types.js'

export function parsePath(pathString: string): Segment[] {
  const tokens = pathString.match(/[^.[\]]+|\[[^\]]*\]/g) ?? []

  return tokens.map((token): Segment => {
    if (!token.startsWith('[')) {
      return { kind: 'key', value: token }
    }

    const inner = token.slice(1, -1)

    if (inner === '*') return { kind: 'some' }
    if (inner === '+') return { kind: 'all' }
    if (inner === '-') return { kind: 'none' }

    const idx = Number(inner)
    if (Number.isInteger(idx) && idx >= 0) {
      return { kind: 'index', index: idx }
    }

    throw new Error(`Invalid array operator: [${inner}]`)
  })
}
