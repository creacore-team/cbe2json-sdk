import { inspect } from 'node:util'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  AuthenticationError,
  CBE2JSON,
  ConnectionError,
  CreditsExhaustedError,
  NotFoundError,
  TimeoutError,
  ValidationError,
} from '../src/index'
import { CREDS, fixture, mockFetch, sentRequest } from './helpers'

const cbe = () => new CBE2JSON(CREDS)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('companies.get', () => {
  it('posts the trimmed number to byCBE and returns { data, meta }', async () => {
    const body = fixture('get-company')
    const fetchMock = mockFetch(200, body)
    const result = await cbe().companies.get('  BE 0202.239.951 ')
    expect(sentRequest(fetchMock).url).toBe('https://api.cbe2json.be/byCBE')
    expect(sentRequest(fetchMock).body.data).toEqual({
      cbe: 'BE 0202.239.951',
    })
    expect(result).toEqual(body)
    expect(result.data.enterpriseNumber).toBe('0202.239.951')
    expect(result.meta.creditsUsed).toBe(1)
  })

  it('throws NotFoundError with the credits for an unknown number', async () => {
    mockFetch(404, fixture('error-not-found'))
    const error = await cbe()
      .companies.get('9999.999.999')
      .catch((e) => e)
    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.meta.creditsUsed).toBe(0)
  })

  it('rejects a non-string number before calling the API', async () => {
    const fetchMock = mockFetch(200, fixture('get-company'))
    await expect(cbe().companies.get(202239951 as never)).rejects.toThrow(
      new TypeError('CBE2JSON: enterpriseNumber must be a string'),
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('companies.search', () => {
  it('sends only the name when no paging is given', async () => {
    const fetchMock = mockFetch(200, fixture('search-companies'))
    const result = await cbe().companies.search({ name: 'Proximus' })
    expect(sentRequest(fetchMock).url).toBe(
      'https://api.cbe2json.be/byDenomination',
    )
    expect(sentRequest(fetchMock).body.data).toEqual({
      denomination: 'Proximus',
    })
    expect(result.data).toHaveLength(2)
    expect(result.meta).toMatchObject({ total: 20, limit: 2, hasNext: true })
  })

  it('passes limit and offset through', async () => {
    const fetchMock = mockFetch(200, fixture('search-companies'))
    await cbe().companies.search({ name: 'Proximus', limit: 20, offset: 40 })
    expect(sentRequest(fetchMock).body.data).toEqual({
      denomination: 'Proximus',
      limit: 20,
      offset: 40,
    })
  })

  it('an empty result is [] with its meta', async () => {
    mockFetch(200, fixture('search-empty'))
    const result = await cbe().companies.search({ name: 'zq7sv-nothing' })
    expect(result.data).toEqual([])
    expect(result.meta.creditsUsed).toBe(0)
  })

  it('rejects a missing name before calling the API', async () => {
    const fetchMock = mockFetch(200, fixture('search-empty'))
    await expect(cbe().companies.search({} as never)).rejects.toThrow(
      new TypeError('CBE2JSON: search needs a name'),
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('a limit above 100 is the API’s ValidationError', async () => {
    mockFetch(400, fixture('error-limit'))
    await expect(
      cbe().companies.search({ name: 'Proximus', limit: 101 }),
    ).rejects.toBeInstanceOf(ValidationError)
  })
})

describe('the secret key never leaks through errors', () => {
  it.each([
    [401, 'error-auth', AuthenticationError],
    [400, 'error-validation', ValidationError],
    [400, 'error-credits', CreditsExhaustedError],
    [404, 'error-not-found', NotFoundError],
    [502, 'Bad Gateway', ApiError],
  ])('HTTP %p %s', async (status, name, type) => {
    mockFetch(status, name === 'Bad Gateway' ? name : fixture(name))
    const error = await cbe()
      .companies.get('0202.239.951')
      .catch((e) => e)
    expect(error).toBeInstanceOf(type)
    expect(inspect(error, { depth: 10, showHidden: true })).not.toContain(
      CREDS.secretKey,
    )
  })

  it('timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: unknown, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(init.signal?.reason),
            )
          }),
      ),
    )
    const error = await new CBE2JSON({ ...CREDS, timeout: 20 }).companies
      .get('0202.239.951')
      .catch((e) => e)
    expect(error).toBeInstanceOf(TimeoutError)
    expect(inspect(error, { depth: 10, showHidden: true })).not.toContain(
      CREDS.secretKey,
    )
  })

  it('connection error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('fetch failed')),
    )
    const error = await cbe()
      .companies.get('0202.239.951')
      .catch((e) => e)
    expect(error).toBeInstanceOf(ConnectionError)
    expect(inspect(error, { depth: 10, showHidden: true })).not.toContain(
      CREDS.secretKey,
    )
  })
})
