import type {
  Activity,
  Address,
  Company,
  CompanyMatch,
  Contact,
  Denomination,
  Establishment,
  FoundCompany,
  ResponseMeta,
  SearchMeta,
} from '../src/types'

// Field rules checked against real responses (fixtures here, the live API in
// tests/live). `satisfies Record<keyof T, Rule>` makes the compiler reject a
// spec that misses or adds a field compared with the public type.
type Rule =
  | 'string'
  | 'string?'
  | 'number'
  | 'number?'
  | 'boolean'
  | 'boolean?'
  | 'string|null'
  | 'number|null'
  | 'description?'
  | 'string[]'
  | { literal: string }
  | { array: Spec }
  | { object: Spec }
export type Spec = { readonly [key: string]: Rule }

const DENOMINATION = {
  language: 'number',
  languageDescription: 'description?',
  typeOfDenomination: 'string',
  typeOfDenominationDescription: 'description?',
  denomination: 'string',
} satisfies Record<keyof Denomination, Rule>

const ADDRESS = {
  typeOfAddress: 'string',
  typeOfAddressDescription: 'description?',
  countryNL: 'string?',
  countryFR: 'string?',
  zipcode: 'string?',
  municipalityNL: 'string?',
  municipalityFR: 'string?',
  streetNL: 'string?',
  streetFR: 'string?',
  houseNumber: 'string?',
  box: 'string?',
  extraAddressInfo: 'string?',
  dateStrikingOff: 'string?',
} satisfies Record<keyof Address, Rule>

const CONTACT = {
  entityContact: 'string',
  entityContactDescription: 'description?',
  contactType: 'string',
  contactTypeDescription: 'description?',
  value: 'string',
} satisfies Record<keyof Contact, Rule>

const ACTIVITY = {
  activityGroup: 'string',
  activityGroupDescription: 'description?',
  naceVersion: 'string',
  naceCode: 'string',
  naceCodeDescription: 'description?',
  classification: 'string',
  classificationDescription: 'description?',
} satisfies Record<keyof Activity, Rule>

const ESTABLISHMENT = {
  establishmentNumber: 'string',
  startDate: 'string',
  denominations: { array: DENOMINATION },
  addresses: { array: ADDRESS },
  contacts: { array: CONTACT },
  activities: { array: ACTIVITY },
} satisfies Record<keyof Establishment, Rule>

export const COMPANY = {
  enterpriseNumber: 'string',
  status: 'string',
  statusDescription: 'description?',
  juridicalSituation: 'string',
  juridicalSituationDescription: 'description?',
  typeOfEnterprise: 'number',
  typeOfEnterpriseDescription: 'description?',
  juridicalForm: 'number?',
  juridicalFormDescription: 'description?',
  startDate: 'string',
  denominations: { array: DENOMINATION },
  addresses: { array: ADDRESS },
  contacts: { array: CONTACT },
  activities: { array: ACTIVITY },
  establishments: { array: ESTABLISHMENT },
} satisfies Record<keyof Company, Rule>

export const RESPONSE_META = {
  source: { literal: 'CBE' },
  dataUpdatedAt: 'string|null',
  creditsUsed: 'number',
  creditsRemaining: 'number|null',
  creditsLimit: 'number|null',
  creditsResetAt: 'string|null',
} satisfies Record<keyof ResponseMeta, Rule>

export const SEARCH_META = {
  ...RESPONSE_META,
  total: 'number',
  limit: 'number',
  offset: 'number',
  hasNext: 'boolean',
  totalCapped: 'boolean?',
} satisfies Record<keyof SearchMeta, Rule>

const MATCH = {
  registeredOffice: 'boolean',
  establishments: 'string[]',
} satisfies Record<keyof CompanyMatch, Rule>

export const FOUND_COMPANY = {
  ...COMPANY,
  match: { object: MATCH },
} satisfies Record<keyof FoundCompany, Rule>

const DESCRIPTION_LANGUAGES = ['FR', 'NL', 'DE']

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fail(path: string, problem: string): never {
  throw new Error(`${path}: ${problem}`)
}

/** Throws unless `value` has exactly the fields `spec` allows, with the right types. */
export function expectShape(value: unknown, spec: Spec, path: string): void {
  if (!isObject(value)) fail(path, 'expected an object')
  for (const key of Object.keys(value)) {
    if (!(key in spec)) fail(`${path}.${key}`, 'field not in the SDK types')
  }
  for (const [key, rule] of Object.entries(spec)) {
    checkRule(value[key], rule, `${path}.${key}`)
  }
}

function checkRule(value: unknown, rule: Rule, path: string): void {
  if (typeof rule === 'object') {
    if ('literal' in rule) {
      if (value !== rule.literal) fail(path, `expected "${rule.literal}"`)
      return
    }
    if ('object' in rule) {
      expectShape(value, rule.object, path)
      return
    }
    if (!Array.isArray(value)) fail(path, 'expected an array')
    value.forEach((item, i) => expectShape(item, rule.array, `${path}[${i}]`))
    return
  }
  if (rule === 'string[]') {
    if (!Array.isArray(value)) fail(path, 'expected an array')
    value.forEach((item, i) => {
      if (typeof item !== 'string') fail(`${path}[${i}]`, 'expected string')
    })
    return
  }
  const optional = rule.endsWith('?')
  const base = optional ? rule.slice(0, -1) : rule
  if (value === undefined) {
    if (optional) return
    fail(path, 'missing')
  }
  if (base === 'description') {
    if (!isObject(value)) fail(path, 'expected a description object')
    for (const [language, text] of Object.entries(value)) {
      if (!DESCRIPTION_LANGUAGES.includes(language)) {
        fail(`${path}.${language}`, 'language not in the SDK types')
      }
      if (typeof text !== 'string')
        fail(`${path}.${language}`, 'expected a string')
    }
    return
  }
  const [type, nullable] = base.split('|')
  if (value === null) {
    if (nullable === 'null') return
    fail(path, 'is null')
  }
  if (typeof value !== type) fail(path, `expected ${type}`)
}
