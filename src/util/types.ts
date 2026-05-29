export type Segment =
  | { kind: 'key';   value: string }
  | { kind: 'index'; index: number }
  | { kind: 'some'                 }
  | { kind: 'all'                  }
  | { kind: 'none'                 }
