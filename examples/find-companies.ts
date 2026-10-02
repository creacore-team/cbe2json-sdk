// Run: CBE2JSON_CLIENT_ID=… CBE2JSON_SECRET_KEY=… npx tsx examples/find-companies.ts
import { CBE2JSON } from '@cbe2json/sdk'

const cbe = new CBE2JSON({
  clientId: process.env.CBE2JSON_CLIENT_ID!,
  secretKey: process.env.CBE2JSON_SECRET_KEY!,
})

// Which companies are registered at this address?
const { data, meta } = await cbe.companies.find({
  zipcode: '1000',
  street: 'Rue de la Loi',
  houseNumber: '16',
})

for (const company of data) {
  console.log(company.enterpriseNumber, company.match)
}
console.log(`${meta.total} companies, ${meta.creditsUsed} credits used`)
if (meta.hasNext) {
  console.log(
    `Next page: find({ zipcode: '1000', street: 'Rue de la Loi', houseNumber: '16', offset: ${meta.offset + meta.limit} })`,
  )
}

// Same filters, enterprise numbers only.
const numbers = await cbe.companies.findNumbers({
  zipcode: '1000',
  street: 'Rue de la Loi',
  houseNumber: '16',
})
console.log(numbers.data)
