// Run: CBE2JSON_CLIENT_ID=… CBE2JSON_SECRET_KEY=… npx tsx examples/search-companies.ts
import { CBE2JSON } from '@cbe2json/sdk'

const cbe = new CBE2JSON({
  clientId: process.env.CBE2JSON_CLIENT_ID!,
  secretKey: process.env.CBE2JSON_SECRET_KEY!,
})

const { data, meta } = await cbe.companies.search({
  name: 'Proximus',
  limit: 5,
})

for (const company of data) {
  console.log(company.enterpriseNumber, company.denominations[0]?.denomination)
}
console.log(`${meta.total} matches, ${meta.creditsUsed} credits used`)
if (meta.hasNext) {
  console.log(
    `Next page: search({ name: 'Proximus', limit: 5, offset: ${meta.offset + meta.limit} })`,
  )
}
