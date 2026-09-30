import { describe, expect, it } from 'vitest'
import { CBE2JSON } from '../../src/index'
import { COMPANY, RESPONSE_META, SEARCH_META, expectShape } from '../shape'

// Calls the real API (dev by default) and checks the answers against the
// SDK types, so an API change the types do not know about fails here.
const clientId = process.env.CBE2JSON_CLIENT_ID
const secretKey = process.env.CBE2JSON_SECRET_KEY
const baseUrl = process.env.CBE2JSON_BASE_URL ?? 'https://api.dev.cbe2json.be'

if (!clientId || !secretKey) {
  throw new Error(
    'Set CBE2JSON_CLIENT_ID and CBE2JSON_SECRET_KEY to run the live check',
  )
}

const cbe = new CBE2JSON({ clientId, secretKey, baseUrl })

describe(`live API (${baseUrl})`, () => {
  it('companies.get matches the SDK types', async () => {
    const { data, meta } = await cbe.companies.get('0202.239.951')
    expect(data.enterpriseNumber).toBe('0202.239.951')
    expectShape(data, COMPANY, 'data')
    expectShape(meta, RESPONSE_META, 'meta')
  })

  it('companies.search matches the SDK types', async () => {
    const { data, meta } = await cbe.companies.search({
      name: 'Proximus',
      limit: 2,
    })
    expect(data.length).toBeGreaterThan(0)
    data.forEach((company, i) => expectShape(company, COMPANY, `data[${i}]`))
    expectShape(meta, SEARCH_META, 'meta')
  })
})
