# Changelog

## 0.1.0

- `CBE2JSON` client with `companies.get` and `companies.search`, returning `{ data, meta }` with credits.
- Error classes: `AuthenticationError`, `ValidationError`, `NotFoundError`, `CreditsExhaustedError`, `TimeoutError`, `ConnectionError`, `ApiError`.
- `normalizeEnterpriseNumber`.
- ESM and CommonJS builds with TypeScript types; Node.js 20+; no dependencies.
