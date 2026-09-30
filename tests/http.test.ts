import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  ConnectionError,
  NotFoundError,
  TimeoutError,
} from '../src/errors'
import { post, type HttpConfig } from '../src/http'
import { VERSION } from '../src/version'
import { CREDS, fixture, mockFetch, sentRequest } from './helpers'

const config: HttpConfig = {
  ...CREDS,
  baseUrl: 'https://api.example.test',
  timeout: 1000,
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('post', () => {
  it('sends the JSON body and the three headers', async () => {
    const fetchMock = mockFetch(200, fixture('get-company'))
    await post(config, 'byCBE', { cbe: '0202.239.951' })
    const request = sentRequest(fetchMock)
    expect(request.url).toBe('https://api.example.test/byCBE')
    expect(request.method).toBe('POST')
    expect(request.body).toEqual({
      clientId: CREDS.clientId,
      secretKey: CREDS.secretKey,
      data: { cbe: '0202.239.951' },
    })
    expect(request.headers).toEqual({
      'Content-Type': 'application/json',
      'CBE2JSON-Version': '2',
      'User-Agent': `cbe2json-sdk-js/${VERSION} node/${process.versions.node}`,
    })
    expect(request.signal).toBeInstanceOf(AbortSignal)
    expect(request.redirect).toBe('error')
  })

  it('returns the { data, meta } body unchanged', async () => {
    const body = fixture('get-company')
    mockFetch(200, body)
    await expect(post(config, 'byCBE', { cbe: 'x' })).resolves.toEqual(body)
  })

  it('maps an error answer', async () => {
    mockFetch(404, fixture('error-not-found'))
    await expect(post(config, 'byCBE', { cbe: 'x' })).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it('a non-JSON error body becomes ApiError with the status', async () => {
    mockFetch(502, '<html>Bad Gateway</html>', 'text/html')
    // post() has no type argument here, so TS infers T as `unknown`; that
    // collapses `.catch((e) => e)` to `unknown` too (TS 5.9), even though
    // this promise always rejects.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error: any = await post(config, 'byCBE', { cbe: 'x' }).catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(502)
    expect(error.message).not.toContain('<html>')
  })

  it('a 200 that is not { data, meta } becomes ApiError', async () => {
    mockFetch(200, { enterpriseNumber: '0202.239.951' })
    await expect(post(config, 'byCBE', { cbe: 'x' })).rejects.toBeInstanceOf(
      ApiError,
    )
  })

  it('times out with TimeoutError', async () => {
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
    // See the note on the same pattern above.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error: any = await post({ ...config, timeout: 20 }, 'byCBE', {
      cbe: 'x',
    }).catch((e) => e)
    expect(error).toBeInstanceOf(TimeoutError)
    expect(error.message).toBe('The CBE2JSON API did not answer within 20 ms')
  })

  it('a network failure becomes ConnectionError with the cause', async () => {
    const cause = new TypeError('fetch failed')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause))
    // See the note on the same pattern above.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error: any = await post(config, 'byCBE', { cbe: 'x' }).catch((e) => e)
    expect(error).toBeInstanceOf(ConnectionError)
    expect(error.cause).toBe(cause)
  })
})
