import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  COMPANY,
  FOUND_COMPANY,
  RESPONSE_META,
  SEARCH_META,
  expectShape,
} from './shape'

function load(name: string): { data: unknown; meta: unknown } {
  return JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'),
  )
}

describe('recorded API responses match the SDK types', () => {
  it('get-company', () => {
    const { data, meta } = load('get-company')
    expectShape(data, COMPANY, 'data')
    expectShape(meta, RESPONSE_META, 'meta')
  })

  it('search-companies', () => {
    const { data, meta } = load('search-companies')
    expect(Array.isArray(data)).toBe(true)
    ;(data as unknown[]).forEach((c, i) =>
      expectShape(c, COMPANY, `data[${i}]`),
    )
    expectShape(meta, SEARCH_META, 'meta')
  })

  it('search-empty', () => {
    const { data, meta } = load('search-empty')
    expect(data).toEqual([])
    expectShape(meta, SEARCH_META, 'meta')
  })

  it('find-companies', () => {
    const { data, meta } = load('find-companies')
    expect(Array.isArray(data)).toBe(true)
    ;(data as unknown[]).forEach((c, i) =>
      expectShape(c, FOUND_COMPANY, `data[${i}]`),
    )
    expectShape(meta, SEARCH_META, 'meta')
  })

  it('find-numbers', () => {
    const { data, meta } = load('find-numbers')
    expect(Array.isArray(data)).toBe(true)
    ;(data as unknown[]).forEach((n) => expect(typeof n).toBe('string'))
    expectShape(meta, SEARCH_META, 'meta')
  })

  it('the checker rejects a field the types do not know', () => {
    const { data } = load('get-company')
    expect(() =>
      expectShape({ ...(data as object), name: 'x' }, COMPANY, 'data'),
    ).toThrow('data.name: field not in the SDK types')
  })
})
