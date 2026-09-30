import {
  ConnectionError,
  TimeoutError,
  errorFromResponse,
  unexpectedResponse,
} from './errors'
import { VERSION } from './version'

export interface HttpConfig {
  clientId: string
  secretKey: string
  baseUrl: string
  timeout: number
}

// The SDK always asks for API version 2 ({ data, meta }), whatever version
// the key is pinned to in the dashboard.
const API_VERSION = '2'

function isTimeout(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('name' in error)) {
    return false
  }
  return error.name === 'TimeoutError' || error.name === 'AbortError'
}

function isEnvelope(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    'data' in body &&
    'meta' in body
  )
}

/** POSTs to the data API and returns its { data, meta } body. */
export async function post<T>(
  config: HttpConfig,
  path: string,
  data: Record<string, unknown>,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${config.baseUrl}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CBE2JSON-Version': API_VERSION,
        'User-Agent': `cbe2json-sdk-js/${VERSION} node/${process.versions.node}`,
      },
      body: JSON.stringify({
        clientId: config.clientId,
        secretKey: config.secretKey,
        data,
      }),
      // Never follow a redirect: it would re-send the body (with the
      // secret key) to whatever host the redirect points to.
      redirect: 'error',
      signal: AbortSignal.timeout(config.timeout),
    })
  } catch (error) {
    if (isTimeout(error)) throw new TimeoutError(config.timeout)
    throw new ConnectionError(error)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch (error) {
    // The timeout also covers reading the body.
    if (isTimeout(error)) throw new TimeoutError(config.timeout)
    body = undefined
  }

  if (!response.ok) throw errorFromResponse(response.status, body)
  if (!isEnvelope(body)) throw unexpectedResponse(response.status)
  return body as T
}
