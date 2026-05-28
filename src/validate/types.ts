export type Segment =
  | { kind: 'key';   value: string }
  | { kind: 'index'; index: number }
  | { kind: 'some'                 }
  | { kind: 'all'                  }
  | { kind: 'none'                 }

export type ResolveResult =
  | { kind: 'value';      value: unknown                               }
  | { kind: 'collection'; op: 'some' | 'all' | 'none'; values: unknown[] }
