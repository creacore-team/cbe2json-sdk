import { Companies } from './companies'
import type { CBE2JSONOptions } from './types'

export const DEFAULT_BASE_URL = 'https://api.cbe2json.be'
export const DEFAULT_TIMEOUT = 10_000

function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`CBE2JSON: ${name} is required`)
  }
  return value
}

/** The CBE2JSON API client. */
export class CBE2JSON {
  /** Look up companies by number or name. */
  readonly companies: Companies

  constructor(options: CBE2JSONOptions) {
    const clientId = requireString(options?.clientId, 'clientId')
    const secretKey = requireString(options?.secretKey, 'secretKey')
    const timeout = options.timeout ?? DEFAULT_TIMEOUT
    if (
      typeof timeout !== 'number' ||
      !Number.isFinite(timeout) ||
      timeout <= 0
    ) {
      throw new TypeError(
        'CBE2JSON: timeout must be a positive number of milliseconds',
      )
    }
    const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '')
    this.companies = new Companies({ clientId, secretKey, baseUrl, timeout })
  }
}
