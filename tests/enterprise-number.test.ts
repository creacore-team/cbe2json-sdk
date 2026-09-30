import { describe, expect, it } from 'vitest'
import { normalizeEnterpriseNumber } from '../src/enterprise-number'

describe('normalizeEnterpriseNumber', () => {
  it.each([
    ['0202.239.951', '0202.239.951'],
    ['0202239951', '0202.239.951'],
    ['BE0202239951', '0202.239.951'],
    ['BE 0202.239.951', '0202.239.951'],
    ['BE0202.239.951', '0202.239.951'],
    ['202239951', '0202.239.951'],
    ['202.239.951', '0202.239.951'],
    ['1202.239.951', '1202.239.951'],
    ['  0202.239.951  ', '0202.239.951'],
  ])('accepts %p', (input, expected) => {
    expect(normalizeEnterpriseNumber(input)).toBe(expected)
  })

  it.each([
    '',
    '123',
    'be0202239951',
    'BE  0202239951',
    '0202 239 951',
    '0202-239-951',
    '02022399510',
    '0202.239.95A',
  ])('rejects %p', (input) => {
    expect(normalizeEnterpriseNumber(input)).toBeNull()
  })
})
