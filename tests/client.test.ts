import { inspect } from 'node:util'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CBE2JSON } from '../src/index'
import { CREDS, fixture, mockFetch, sentRequest } from './helpers'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('new CBE2JSON', () => {
  it.each([
    [{ secretKey: CREDS.secretKey }, 'clientId'],
    [{ clientId: CREDS.clientId }, 'secretKey'],
    [{ clientId: ' ', secretKey: CREDS.secretKey }, 'clientId'],
    [{ clientId: CREDS.clientId, secretKey: '' }, 'secretKey'],
  ])('requires both credentials (%j)', (options, missing) => {
    expect(() => new CBE2JSON(options as never)).toThrow(
      new TypeError(`CBE2JSON: ${missing} is required`),
    )
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, '1000'])(
    'rejects timeout %p',
    (timeout) => {
      expect(
        () => new CBE2JSON({ ...CREDS, timeout: timeout as number }),
      ).toThrow(TypeError)
    },
  )

  it('uses https://api.cbe2json.be by default', async () => {
    const fetchMock = mockFetch(200, fixture('get-company'))
    await new CBE2JSON(CREDS).companies.get('0202.239.951')
    expect(sentRequest(fetchMock).url).toBe('https://api.cbe2json.be/byCBE')
  })

  it.each(['https://api.dev.cbe2json.be', 'https://api.dev.cbe2json.be/'])(
    'accepts baseUrl %p',
    async (baseUrl) => {
      const fetchMock = mockFetch(200, fixture('get-company'))
      await new CBE2JSON({ ...CREDS, baseUrl }).companies.get('0202.239.951')
      expect(sentRequest(fetchMock).url).toBe(
        'https://api.dev.cbe2json.be/byCBE',
      )
    },
  )

  it('does not show the secret key when inspected', () => {
    const cbe = new CBE2JSON(CREDS)
    expect(inspect(cbe, { depth: 10, showHidden: true })).not.toContain(
      CREDS.secretKey,
    )
    expect(JSON.stringify(cbe)).not.toContain(CREDS.secretKey)
  })
})
