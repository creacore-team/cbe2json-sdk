import type { ResponseMeta } from './types'

interface ErrorFields {
  status?: number
  code?: string
  meta?: ResponseMeta
  cause?: unknown
}

/** Base class of every error the SDK throws. */
export class CBE2JSONError extends Error {
  /** HTTP status, when the API answered. */
  readonly status?: number
  /** The API's errorCode, e.g. "ENTERPRISE_NOT_FOUND". */
  readonly code?: string
  /** Credits and dataset, when the API returned them. */
  readonly meta?: ResponseMeta

  constructor(message: string, fields: ErrorFields = {}) {
    super(
      message,
      fields.cause === undefined ? undefined : { cause: fields.cause },
    )
    // A literal, not `new.target.name`: class names can be renamed by a
    // minifier, but a string literal always survives.
    this.name = 'CBE2JSONError'
    this.status = fields.status
    this.code = fields.code
    this.meta = fields.meta
  }
}

/** The clientId / secretKey pair was refused. */
export class AuthenticationError extends CBE2JSONError {
  constructor(message: string, fields: ErrorFields = {}) {
    super(message, fields)
    this.name = 'AuthenticationError'
  }
}

/** The request was refused as invalid (e.g. a malformed number, limit > 100). */
export class ValidationError extends CBE2JSONError {
  constructor(message: string, fields: ErrorFields = {}) {
    super(message, fields)
    this.name = 'ValidationError'
  }
}

/** No company has this enterprise number. No credit was used. */
export class NotFoundError extends CBE2JSONError {
  constructor(message: string, fields: ErrorFields = {}) {
    super(message, fields)
    this.name = 'NotFoundError'
  }
}

/** Not enough credits left this month. Nothing was charged. */
export class CreditsExhaustedError extends CBE2JSONError {
  /** Your monthly allowance, when known. */
  readonly limit: number | null
  /** Credits left, when known. */
  readonly remaining: number | null
  /** When used credits next return to 0 (ISO 8601), when known. */
  readonly resetAt: string | null

  constructor(message: string, fields: ErrorFields = {}) {
    super(message, fields)
    this.name = 'CreditsExhaustedError'
    this.limit = fields.meta?.creditsLimit ?? null
    this.remaining = fields.meta?.creditsRemaining ?? null
    this.resetAt = fields.meta?.creditsResetAt ?? null
  }
}

/** The API did not answer within the configured timeout. */
export class TimeoutError extends CBE2JSONError {
  constructor(timeout: number) {
    super(`The CBE2JSON API did not answer within ${timeout} ms`)
    this.name = 'TimeoutError'
  }
}

/** The API could not be reached (DNS, connection refused or reset). */
export class ConnectionError extends CBE2JSONError {
  constructor(cause: unknown) {
    super('Could not reach the CBE2JSON API', { cause })
    this.name = 'ConnectionError'
  }
}

/** Any other answer: server errors, unknown codes, unreadable bodies. */
export class ApiError extends CBE2JSONError {
  constructor(message: string, fields: ErrorFields = {}) {
    super(message, fields)
    this.name = 'ApiError'
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Maps an error answer of the API to the matching SDK error. */
export function errorFromResponse(
  status: number,
  body: unknown,
): CBE2JSONError {
  const fields: ErrorFields = { status }
  let message: string | undefined
  if (isObject(body)) {
    if (typeof body.errorCode === 'string') fields.code = body.errorCode
    if (typeof body.message === 'string') message = body.message
    if (isObject(body.meta)) fields.meta = body.meta as unknown as ResponseMeta
  }
  if (message === undefined) {
    message = fields.code
      ? `CBE2JSON API error ${fields.code} (HTTP ${status})`
      : `Unexpected response from the CBE2JSON API (HTTP ${status})`
  }
  switch (fields.code) {
    case 'BAD_CLIENT_SECRET':
    case 'UNAUTHORIZED':
      return new AuthenticationError(message, fields)
    case 'VALIDATION_FAILED':
      return new ValidationError(message, fields)
    case 'ENTERPRISE_NOT_FOUND':
      return new NotFoundError(message, fields)
    case 'QUOTA_EXHAUSTED':
      return new CreditsExhaustedError(message, fields)
    default:
      return new ApiError(message, fields)
  }
}

/** A successful status whose body is not the expected { data, meta }. */
export function unexpectedResponse(status: number): ApiError {
  return new ApiError(
    `Unexpected response from the CBE2JSON API (HTTP ${status})`,
    {
      status,
    },
  )
}
