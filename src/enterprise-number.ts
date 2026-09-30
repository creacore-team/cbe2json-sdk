// The API's own definition of an accepted enterprise number (platform
// repository, backend/src/cbe-data/cbe-number.ts): an optional "BE" prefix
// with at most one space after it, then 9 or 10 digits in groups of 1?+3+3+3,
// each boundary optionally dotted. A 9-digit number gets a leading 0.
const ENTERPRISE_NUMBER = /^(?:BE\s?)?(\d)?(\d{3})\.?(\d{3})\.?(\d{3})$/

/**
 * The dotted form ("0202.239.951") of an enterprise number the API accepts,
 * or null. Surrounding whitespace is ignored.
 */
export function normalizeEnterpriseNumber(input: string): string | null {
  const match = ENTERPRISE_NUMBER.exec(input.trim())
  if (match === null) return null
  return `${match[1] ?? '0'}${match[2]}.${match[3]}.${match[4]}`
}
