// Run: CBE2JSON_CLIENT_ID=… CBE2JSON_SECRET_KEY=… npx tsx examples/get-company.ts
import { CBE2JSON, NotFoundError } from '@cbe2json/sdk'

const cbe = new CBE2JSON({
  clientId: process.env.CBE2JSON_CLIENT_ID!,
  secretKey: process.env.CBE2JSON_SECRET_KEY!,
})

try {
  const { data: company, meta } = await cbe.companies.get('0202.239.951')

  // A company has several names (by language and type); "001" is the legal name.
  const legalName = company.denominations.find(
    (d) => d.typeOfDenomination === '001',
  )
  console.log(company.enterpriseNumber, legalName?.denomination)
  console.log(company.juridicalFormDescription?.FR, company.startDate)
  console.log(`${meta.creditsUsed} credit used, ${meta.creditsRemaining} left`)
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('No company with this number (no credit used).')
  } else {
    throw error
  }
}
