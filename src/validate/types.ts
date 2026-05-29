export type ResolveResult =
  | { kind: 'value';      value: unknown                               }
  | { kind: 'collection'; op: 'some' | 'all' | 'none'; values: unknown[] }
