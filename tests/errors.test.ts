import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  ApiError,
  AuthenticationError,
  CBE2JSONError,
  ConnectionError,
  CreditsExhaustedError,
  NotFoundError,
  TimeoutError,
  ValidationError,
  errorFromResponse,
} from '../src/errors'

function load(name: string): unknown {
  return JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'),
  )
}

describe('errorFromResponse', () => {
  it('401 BAD_CLIENT_SECRET → AuthenticationError', () => {
    const error = errorFromResponse(401, load('error-auth'))
    expect(error).toBeInstanceOf(AuthenticationError)
    expect(error).toBeInstanceOf(CBE2JSONError)
    expect(error).toMatchObject({ status: 401, code: 'BAD_CLIENT_SECRET' })
    expect(error.meta).toBeUndefined()
    expect(error.name).toBe('AuthenticationError')
  })

  it('401 UNAUTHORIZED → AuthenticationError', () => {
    const error = errorFromResponse(401, {
      errorCode: 'UNAUTHORIZED',
      message: 'Unauthorized',
    })
    expect(error).toBeInstanceOf(AuthenticationError)
  })

  it('404 ENTERPRISE_NOT_FOUND → NotFoundError with meta', () => {
    const error = errorFromResponse(404, load('error-not-found'))
    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.message).toBe('Enterprise not found')
    expect(error.meta).toMatchObject({ source: 'CBE', creditsUsed: 0 })
  })

  it('400 VALIDATION_FAILED with a message and meta (limit above 100)', () => {
    const error = errorFromResponse(400, load('error-limit'))
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe('data.limit must not be greater than 100')
    expect(error.meta?.creditsUsed).toBe(0)
  })

  it('400 VALIDATION_FAILED without a message gets a clear one', () => {
    const error = errorFromResponse(400, load('error-validation'))
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe(
      'CBE2JSON API error VALIDATION_FAILED (HTTP 400)',
    )
    expect(error.meta).toBeUndefined()
  })

  it('400 QUOTA_EXHAUSTED → CreditsExhaustedError with limit, remaining, resetAt', () => {
    const error = errorFromResponse(400, load('error-credits'))
    expect(error).toBeInstanceOf(CreditsExhaustedError)
    const credits = error as CreditsExhaustedError
    expect(credits.limit).toBe(50)
    expect(credits.remaining).toBe(0)
    expect(credits.resetAt).toBe('2026-10-01T00:00:00.000Z')
  })

  it('QUOTA_EXHAUSTED without meta: nulls', () => {
    const error = errorFromResponse(400, {
      errorCode: 'QUOTA_EXHAUSTED',
      message: 'x',
    }) as CreditsExhaustedError
    expect([error.limit, error.remaining, error.resetAt]).toEqual([
      null,
      null,
      null,
    ])
  })

  it.each([
    [403, { errorCode: 'ORIGIN_NOT_ALLOWED', message: 'Origin not allowed' }],
    [400, { errorCode: 'UNSUPPORTED_API_VERSION', message: 'x' }],
    [500, { errorCode: 'INTERNAL_ERROR' }],
    [502, undefined],
    [503, 'Service Unavailable'],
  ])('HTTP %p %j → ApiError', (status, body) => {
    const error = errorFromResponse(status, body)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(status)
  })

  it('a body without errorCode gets a generic message', () => {
    expect(errorFromResponse(502, undefined).message).toBe(
      'Unexpected response from the CBE2JSON API (HTTP 502)',
    )
  })

  it('ignores a meta that is not an object', () => {
    expect(
      errorFromResponse(404, { errorCode: 'ENTERPRISE_NOT_FOUND', meta: 'x' })
        .meta,
    ).toBeUndefined()
  })
})

describe('network errors', () => {
  it('TimeoutError names the timeout', () => {
    const error = new TimeoutError(250)
    expect(error).toBeInstanceOf(CBE2JSONError)
    expect(error.message).toBe('The CBE2JSON API did not answer within 250 ms')
    expect(error.status).toBeUndefined()
  })

  it('ConnectionError keeps the cause', () => {
    const cause = new Error('getaddrinfo ENOTFOUND api.cbe2json.be')
    const error = new ConnectionError(cause)
    expect(error.message).toBe('Could not reach the CBE2JSON API')
    expect(error.cause).toBe(cause)
  })
})
