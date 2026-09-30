import { Companies } from './companies'
import type { CBE2JSONOptions } from './types'

export const DEFAULT_BASE_URL = 'https://api.cbe2json.be'
export const DEFAULT_TIMEOUT = 10_000

// AbortSignal.timeout() takes an unsigned 32-bit integer of milliseconds;
// above this a value silently overflows to roughly 1 ms (Node/WHATWG).
const MAX_TIMEOUT = 2_147_483_647

// Hosts allowed to use plain http, for local development.
const LOCAL_HTTP_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`CBE2JSON: ${name} is required`)
  }
  return value
}

function validateTimeout(timeout: unknown): number {
  if (
    typeof timeout !== 'number' ||
    !Number.isInteger(timeout) ||
    timeout <= 0 ||
    timeout > MAX_TIMEOUT
  ) {
    throw new TypeError(
      'CBE2JSON: timeout must be a positive whole number of milliseconds',
    )
  }
  return timeout
}

function validateBaseUrl(baseUrl: unknown): string {
  if (typeof baseUrl !== 'string') {
    throw new TypeError('CBE2JSON: baseUrl must be an https URL')
  }
  let parsed: URL
  try {
    parsed = new URL(baseUrl)
  } catch {
    throw new TypeError('CBE2JSON: baseUrl must be an https URL')
  }
  const isLocalHttp =
    parsed.protocol === 'http:' && LOCAL_HTTP_HOSTS.has(parsed.hostname)
  if (parsed.protocol !== 'https:' && !isLocalHttp) {
    throw new TypeError('CBE2JSON: baseUrl must be an https URL')
  }
  return baseUrl.replace(/\/+$/, '')
}

/** The CBE2JSON API client. */
export class CBE2JSON {
  /** Look up companies by number or name. */
  readonly companies: Companies

  constructor(options: CBE2JSONOptions) {
    const clientId = requireString(options?.clientId, 'clientId')
    const secretKey = requireString(options?.secretKey, 'secretKey')
    const timeout = validateTimeout(options.timeout ?? DEFAULT_TIMEOUT)
    const baseUrl = validateBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL)
    this.companies = new Companies({ clientId, secretKey, baseUrl, timeout })
  }
}
