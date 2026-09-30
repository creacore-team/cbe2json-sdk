import { readFileSync } from 'node:fs'
import { vi } from 'vitest'

// Fake credentials; the secret contains a marker the leak tests search for.
export const CREDS = {
  clientId: '0123456789abcdef',
  secretKey: 'zq7sv-secret-zq7sv-0123456789abcdef',
}

export function fixture(name: string): unknown {
  return JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'),
  )
}

type FetchArgs = [input: string | URL | Request, init?: RequestInit]

/** Replaces global fetch with one answering `status` and `body` once per call. */
export function mockFetch(
  status: number,
  body: unknown,
  contentType = 'application/json',
) {
  const fn = vi.fn(
    async (..._args: FetchArgs) =>
      new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': contentType },
      }),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

/** The first request the mocked fetch received. */
export function sentRequest(fn: ReturnType<typeof mockFetch>) {
  const [input, init] = fn.mock.calls[0] as FetchArgs
  return {
    url: String(input),
    method: init?.method,
    headers: init?.headers as Record<string, string>,
    body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    signal: init?.signal,
  }
}
