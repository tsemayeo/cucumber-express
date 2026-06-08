import { describe, it, expect } from 'vitest'
import { DataTable } from '@cucumber/cucumber'
import { validatePath, validateAssertValue, validateBuildValue, validateBuildPathFromSchema, validateBuildValueFromSchema } from '../../src/util/syntax.js'
import { assertResponse } from '../../src/assert/index.js'
import { buildRequest } from '../../src/build/index.js'

const table = (rows: string[][]): DataTable => new DataTable(rows)

// ─── validatePath ───────────────────────────────────────────────────────────

describe('validatePath — invalid paths', () => {
  it('rejects empty string', () => {
    expect(validatePath('')).not.toBeNull()
  })

  it('rejects bare dot', () => {
    expect(validatePath('.')).not.toBeNull()
  })

  it('rejects leading dot', () => {
    expect(validatePath('.name')).not.toBeNull()
  })

  it('rejects trailing dot', () => {
    expect(validatePath('name.')).not.toBeNull()
  })

  it('rejects consecutive dots', () => {
    expect(validatePath('name..age')).not.toBeNull()
  })

  it('rejects three or more consecutive dots', () => {
    expect(validatePath('name...age')).not.toBeNull()
  })

  it('rejects empty brackets []', () => {
    expect(validatePath('items[]')).not.toBeNull()
  })

  it('rejects negative index [-1]', () => {
    expect(validatePath('items[-1]')).not.toBeNull()
  })

  it('rejects float index [1.5]', () => {
    expect(validatePath('items[1.5]')).not.toBeNull()
  })
})

describe('validatePath — valid paths', () => {
  it('accepts a single key', () => {
    expect(validatePath('name')).toBeNull()
  })

  it('accepts nested keys', () => {
    expect(validatePath('body.user.name')).toBeNull()
  })

  it('accepts a numeric index', () => {
    expect(validatePath('items[0]')).toBeNull()
  })

  it('accepts the some operator [*]', () => {
    expect(validatePath('items[*].type')).toBeNull()
  })

  it('accepts the all operator [+]', () => {
    expect(validatePath('items[+].active')).toBeNull()
  })

  it('accepts the none operator [-]', () => {
    expect(validatePath('items[-].deleted')).toBeNull()
  })
})

// ─── validateAssertValue ────────────────────────────────────────────────────

describe('validateAssertValue — invalid values', () => {
  it('rejects an invalid regex in /pattern/ form', () => {
    expect(validateAssertValue('/unclosed(/')).not.toBeNull()
  })

  it('rejects another invalid regex pattern', () => {
    expect(validateAssertValue('/(foo/')).not.toBeNull()
  })

  it('rejects an invalid regex in capture gate', () => {
    expect(validateAssertValue('{key:/unclosed(/}')).not.toBeNull()
  })

  it('rejects a malformed capture gate with no closing /}', () => {
    expect(validateAssertValue('{key:/unclosed}')).not.toBeNull()
  })
})

describe('validateAssertValue — valid values', () => {
  it('accepts a literal string', () => {
    expect(validateAssertValue('John')).toBeNull()
  })

  it('accepts <null>', () => {
    expect(validateAssertValue('<null>')).toBeNull()
  })

  it('accepts <present>', () => {
    expect(validateAssertValue('<present>')).toBeNull()
  })

  it('accepts <empty>', () => {
    expect(validateAssertValue('<empty>')).toBeNull()
  })

  it('accepts a plain capture {key}', () => {
    expect(validateAssertValue('{key}')).toBeNull()
  })

  it('accepts a valid capture gate {key:/pattern/}', () => {
    expect(validateAssertValue('{key:/^J/}')).toBeNull()
  })

  it('accepts a lookup <key>', () => {
    expect(validateAssertValue('<userId>')).toBeNull()
  })

  it('accepts a valid regex /pattern/', () => {
    expect(validateAssertValue('/^J/')).toBeNull()
  })
})

// ─── validateBuildValue ─────────────────────────────────────────────────────

describe('validateBuildValue — invalid values', () => {
  it('rejects (int) with non-numeric string', () => {
    expect(validateBuildValue('(int) abc')).not.toBeNull()
  })

  it('rejects (int) with empty value', () => {
    expect(validateBuildValue('(int) ')).not.toBeNull()
  })

  it('rejects (float) with non-numeric string', () => {
    expect(validateBuildValue('(float) abc')).not.toBeNull()
  })

  it('rejects (float) with empty value', () => {
    expect(validateBuildValue('(float) ')).not.toBeNull()
  })

  it('rejects (boolean) with a non-boolean string', () => {
    expect(validateBuildValue('(boolean) maybe')).not.toBeNull()
  })

  it('rejects (boolean) with empty value', () => {
    expect(validateBuildValue('(boolean) ')).not.toBeNull()
  })

  it('rejects (int) combined with <null>', () => {
    expect(validateBuildValue('(int) <null>')).not.toBeNull()
  })

  it('rejects (boolean) combined with <null>', () => {
    expect(validateBuildValue('(boolean) <null>')).not.toBeNull()
  })

  it('rejects (int) combined with <empty>', () => {
    expect(validateBuildValue('(int) <empty>')).not.toBeNull()
  })

  it('rejects (string) combined with <empty>', () => {
    expect(validateBuildValue('(string) <empty>')).not.toBeNull()
  })
})

describe('validateBuildValue — valid values', () => {
  it('accepts (int) with a valid integer', () => {
    expect(validateBuildValue('(int) 30')).toBeNull()
  })

  it('accepts (float) with a valid float', () => {
    expect(validateBuildValue('(float) 9.99')).toBeNull()
  })

  it('accepts (boolean) true', () => {
    expect(validateBuildValue('(boolean) true')).toBeNull()
  })

  it('accepts (boolean) false', () => {
    expect(validateBuildValue('(boolean) false')).toBeNull()
  })

  it('accepts (string) with any value', () => {
    expect(validateBuildValue('(string) hello')).toBeNull()
  })

  it('accepts a bare string', () => {
    expect(validateBuildValue('hello')).toBeNull()
  })

  it('accepts a lookup <key>', () => {
    expect(validateBuildValue('<key>')).toBeNull()
  })

  it('accepts cast + lookup (int) <count>', () => {
    expect(validateBuildValue('(int) <count>')).toBeNull()
  })

  it('accepts cast + lookup (float) <price>', () => {
    expect(validateBuildValue('(float) <price>')).toBeNull()
  })

  it('accepts bare <null>', () => {
    expect(validateBuildValue('<null>')).toBeNull()
  })

  it('accepts bare <empty>', () => {
    expect(validateBuildValue('<empty>')).toBeNull()
  })
})

// ─── validateBuildPathFromSchema ───────────────────────────────────────────

describe('validateBuildPathFromSchema — invalid paths', () => {
  it('rejects [*] collection operator', () => {
    expect(validateBuildPathFromSchema('items[*].name')).not.toBeNull()
  })

  it('rejects [+] collection operator', () => {
    expect(validateBuildPathFromSchema('items[+].active')).not.toBeNull()
  })

  it('rejects [-] collection operator', () => {
    expect(validateBuildPathFromSchema('items[-].deleted')).not.toBeNull()
  })

  it('still rejects base path errors (delegates to validatePath)', () => {
    expect(validateBuildPathFromSchema('items[]')).not.toBeNull()
  })
})

describe('validateBuildPathFromSchema — valid paths', () => {
  it('accepts a simple key', () => {
    expect(validateBuildPathFromSchema('name')).toBeNull()
  })

  it('accepts a nested key', () => {
    expect(validateBuildPathFromSchema('order.items')).toBeNull()
  })

  it('accepts a numeric index', () => {
    expect(validateBuildPathFromSchema('items[0].qty')).toBeNull()
  })
})

// ─── validateBuildValueFromSchema ──────────────────────────────────────────

describe('validateBuildValueFromSchema — invalid values', () => {
  it('rejects (array:) with no number', () => {
    expect(validateBuildValueFromSchema('(array:)')).not.toBeNull()
  })

  it('rejects (array:abc) with non-numeric count', () => {
    expect(validateBuildValueFromSchema('(array:abc)')).not.toBeNull()
  })

  it('rejects (array:-1) with negative count', () => {
    expect(validateBuildValueFromSchema('(array:-1)')).not.toBeNull()
  })

  it('rejects (array:3) with trailing text', () => {
    expect(validateBuildValueFromSchema('(array:3) ExtraText')).not.toBeNull()
  })

  it('rejects (int) with invalid value (delegates to validateBuildValue)', () => {
    expect(validateBuildValueFromSchema('(int) abc')).not.toBeNull()
  })
})

describe('validateBuildValueFromSchema — valid values', () => {
  it('accepts (array:3)', () => {
    expect(validateBuildValueFromSchema('(array:3)')).toBeNull()
  })

  it('accepts (array:0)', () => {
    expect(validateBuildValueFromSchema('(array:0)')).toBeNull()
  })

  it('accepts (int) with valid integer (delegates to validateBuildValue)', () => {
    expect(validateBuildValueFromSchema('(int) 5')).toBeNull()
  })

  it('accepts a bare string', () => {
    expect(validateBuildValueFromSchema('hello')).toBeNull()
  })

  it('accepts a lookup <key>', () => {
    expect(validateBuildValueFromSchema('<key>')).toBeNull()
  })
})

// ─── Integration ────────────────────────────────────────────────────────────

describe('assertResponse — syntax errors thrown upfront', () => {
  it('reports all path errors together when multiple rows are invalid', () => {
    let error: Error | undefined
    try {
      assertResponse(table([
        ['items[]',   'value'],
        ['.bad.path', 'value'],
      ]), {})
    } catch (e) { error = e as Error }
    expect(error?.message).toContain('items[]')
    expect(error?.message).toContain('.bad.path')
  })

  it('throws on an invalid regex value before evaluating the object', () => {
    expect(() =>
      assertResponse(table([['body.name', '/unclosed(/']]), {})
    ).toThrow('unclosed(')
  })
})

describe('buildRequest — syntax errors thrown upfront', () => {
  it('reports path and value errors together', () => {
    let error: Error | undefined
    try {
      buildRequest(() => ({}), table([
        ['items[]',    'value'],
        ['body.name',  '(int) abc'],
      ]))
    } catch (e) { error = e as Error }
    expect(error?.message).toContain('items[]')
    expect(error?.message).toContain('abc')
  })

  it('does not call the schema factory when syntax errors are present', () => {
    let calls = 0
    const schema = () => { calls++; return {} }
    try {
      buildRequest(schema, table([['items[]', 'value']]))
    } catch { /* expected */ }
    expect(calls).toBe(0)
  })
})
