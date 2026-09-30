# CBE2JSON JavaScript SDK

Official TypeScript and JavaScript SDK for CBE2JSON — Belgian CBE / BCE / KBO company data through a simple API.

```bash
npm install @cbe2json/sdk
```

```ts
import { CBE2JSON } from '@cbe2json/sdk'

const cbe = new CBE2JSON({
  clientId: process.env.CBE2JSON_CLIENT_ID!,
  secretKey: process.env.CBE2JSON_SECRET_KEY!,
})

const { data: company, meta } = await cbe.companies.get('0202.239.951')

console.log(company.enterpriseNumber, company.denominations[0]?.denomination)
console.log(`${meta.creditsRemaining} credits left`)
```

**[Get a free API key](https://www.cbe2json.be/auth/signup?utm_source=github&utm_medium=sdk&utm_campaign=javascript_sdk) — 50 free credits a month.**

[Website](https://www.cbe2json.be/?utm_source=github&utm_medium=sdk&utm_campaign=javascript_sdk) · [API documentation](https://www.cbe2json.be/documentation?utm_source=github&utm_medium=sdk&utm_campaign=javascript_sdk) · [Pricing](https://www.cbe2json.be/?utm_source=github&utm_medium=sdk&utm_campaign=javascript_sdk#pricing) · [npm](https://www.npmjs.com/package/@cbe2json/sdk) · [Issues](https://github.com/creacore-team/cbe2json-sdk/issues)

## What is CBE2JSON?

CBE2JSON serves the Crossroads Bank for Enterprises (CBE / BCE / KBO) — Belgium's official company register — as JSON: names, addresses, legal form, NACE activities, establishments and contacts, refreshed daily from the official dataset.

## Installation

```bash
npm install @cbe2json/sdk
```

Node.js 20 or later. Works with `import` and `require`, ships its own TypeScript types, and has no dependencies.

## Authentication

Create an API key in your [dashboard](https://www.cbe2json.be/dashboard?utm_source=github&utm_medium=sdk&utm_campaign=javascript_sdk). Each key has a **client ID** and a **secret key**. Keep them in environment variables, never in code:

```bash
export CBE2JSON_CLIENT_ID=...
export CBE2JSON_SECRET_KEY=...
```

Use the SDK from your server: the secret key must not reach a browser.

## Get a company

```ts
const { data: company, meta } = await cbe.companies.get('BE 0202.239.951')
```

Accepted formats: `0202.239.951`, `0202239951`, `BE0202239951`, `BE 0202.239.951`, and the older 9-digit numbers. `normalizeEnterpriseNumber('BE0202239951')` returns `'0202.239.951'`, or `null` for a number the API would refuse.

A company has several names, one per language and type. `typeOfDenomination` `'001'` is the legal name:

```ts
const legalName = company.denominations.find(
  (d) => d.typeOfDenomination === '001',
)
```

Coded values come with their description: `company.juridicalFormDescription?.FR`, `activity.naceCodeDescription?.NL`, …

## Search companies

```ts
const { data, meta } = await cbe.companies.search({
  name: 'Proximus',
  limit: 20, // 1 to 100, default 10
  offset: 0,
})

console.log(`${meta.total} matches`, meta.hasNext)
```

Search looks at company and establishment names. No match returns an empty list.

## Credits

Every result has a `meta` object:

| Field              | Meaning                            |
| ------------------ | ---------------------------------- |
| `creditsUsed`      | Credits this call used             |
| `creditsRemaining` | Credits left this month            |
| `creditsLimit`     | Your monthly allowance             |
| `creditsResetAt`   | When your credits reset (ISO 8601) |
| `dataUpdatedAt`    | Date of the CBE dataset served     |

`companies.get` uses 1 credit. `companies.search` uses 1 credit per company returned. Errors, unknown numbers and empty searches use none.

## Error handling

```ts
import { CreditsExhaustedError, NotFoundError } from '@cbe2json/sdk'

try {
  await cbe.companies.get('0202.239.951')
} catch (error) {
  if (error instanceof NotFoundError) {
    // unknown number
  } else if (error instanceof CreditsExhaustedError) {
    console.log(`No credits left until ${error.resetAt}`)
  } else {
    throw error
  }
}
```

| Error                   | When                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| `AuthenticationError`   | Wrong client ID or secret key                                        |
| `ValidationError`       | Malformed number, `limit` above 100, …                               |
| `NotFoundError`         | No company has this number                                           |
| `CreditsExhaustedError` | Not enough credits left this month (`limit`, `remaining`, `resetAt`) |
| `TimeoutError`          | No answer within `timeout`                                           |
| `ConnectionError`       | The API could not be reached                                         |
| `ApiError`              | Anything else                                                        |

All extend `CBE2JSONError`, with `status`, `code` (the API's error code) and, when available, `meta`.

The SDK does not retry. A lookup that timed out may still have been served and charged, so retry deliberately:

```ts
async function getWithRetry(number: string) {
  try {
    return await cbe.companies.get(number)
  } catch (error) {
    if (error instanceof TimeoutError || error instanceof ConnectionError) {
      return cbe.companies.get(number)
    }
    throw error
  }
}
```

## Configuration

```ts
new CBE2JSON({
  clientId,
  secretKey,
  baseUrl: 'https://api.cbe2json.be', // default
  timeout: 10_000, // milliseconds, default
})
```

## TypeScript

Every type is exported: `Company`, `Establishment`, `Denomination`, `Address`, `Contact`, `Activity`, `Description`, `ResponseMeta`, `SearchMeta`, `CompanyResult`, `CompanySearchResult`, `CompanySearchParams`, `CBE2JSONOptions`.

## CommonJS

```js
const { CBE2JSON } = require('@cbe2json/sdk')
```

## Examples

[`examples/get-company.ts`](examples/get-company.ts) and [`examples/search-companies.ts`](examples/search-companies.ts).

## API documentation

The full API reference is at [cbe2json.be/documentation](https://www.cbe2json.be/documentation?utm_source=github&utm_medium=sdk&utm_campaign=javascript_sdk).

## Contributing

Issues and pull requests are welcome. `npm test`, `npm run lint` and `npm run typecheck` must pass.

## License

MIT
