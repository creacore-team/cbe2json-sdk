# Changelog

## 0.2.0

- `companies.find(filters)`: look companies up by NACE code, postcode, municipality, street and house number, name, legal form or legal situation. Each result carries `match` (registered office and/or establishments that met the filters).
- `companies.findNumbers(filters)`: the same filters, enterprise numbers only, up to 1000 per page; each page with results uses 1 credit.

## 0.1.0

- `CBE2JSON` client with `companies.get` and `companies.search`, returning `{ data, meta }` with credits.
- Error classes: `AuthenticationError`, `ValidationError`, `NotFoundError`, `CreditsExhaustedError`, `TimeoutError`, `ConnectionError`, `ApiError`.
- `normalizeEnterpriseNumber`.
- ESM and CommonJS builds with TypeScript types; Node.js 20+; no dependencies.
