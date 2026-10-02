/** Readable text of a coded value, by language (FR and NL; DE on some fields). */
export interface Description {
  FR?: string
  NL?: string
  DE?: string
}

export interface Denomination {
  language: number
  languageDescription?: Description
  typeOfDenomination: string
  typeOfDenominationDescription?: Description
  denomination: string
}

export interface Address {
  typeOfAddress: string
  typeOfAddressDescription?: Description
  countryNL?: string
  countryFR?: string
  zipcode?: string
  municipalityNL?: string
  municipalityFR?: string
  streetNL?: string
  streetFR?: string
  houseNumber?: string
  box?: string
  extraAddressInfo?: string
  dateStrikingOff?: string
}

export interface Contact {
  entityContact: string
  entityContactDescription?: Description
  contactType: string
  contactTypeDescription?: Description
  value: string
}

export interface Activity {
  activityGroup: string
  activityGroupDescription?: Description
  naceVersion: string
  naceCode: string
  naceCodeDescription?: Description
  classification: string
  classificationDescription?: Description
}

export interface Establishment {
  establishmentNumber: string
  /** ISO 8601 date-time. */
  startDate: string
  denominations: Denomination[]
  addresses: Address[]
  contacts: Contact[]
  activities: Activity[]
}

export interface Company {
  /** Dotted form, e.g. "0202.239.951". */
  enterpriseNumber: string
  status: string
  statusDescription?: Description
  juridicalSituation: string
  juridicalSituationDescription?: Description
  typeOfEnterprise: number
  typeOfEnterpriseDescription?: Description
  juridicalForm?: number
  juridicalFormDescription?: Description
  /** ISO 8601 date-time. */
  startDate: string
  denominations: Denomination[]
  addresses: Address[]
  contacts: Contact[]
  activities: Activity[]
  establishments: Establishment[]
}

/** About the call: the dataset served and your credits. */
export interface ResponseMeta {
  source: 'CBE'
  /** Date of the CBE dataset served (YYYY-MM-DD), null if unknown. */
  dataUpdatedAt: string | null
  /** Credits this call used. */
  creditsUsed: number
  /** Credits left after this call; null for an account without a limit. */
  creditsRemaining: number | null
  /** Your monthly allowance; null for an account without a limit. */
  creditsLimit: number | null
  /** When used credits next return to 0 (ISO 8601); null when unknown. */
  creditsResetAt: string | null
}

export interface SearchMeta extends ResponseMeta {
  /** Matches in total. */
  total: number
  limit: number
  offset: number
  hasNext: boolean
  /** True when there are more than 10000 matches; total is then 10000. */
  totalCapped?: boolean
}

export interface CompanyResult {
  data: Company
  meta: ResponseMeta
}

export interface CompanySearchResult {
  data: Company[]
  meta: SearchMeta
}

export interface CompanySearchParams {
  /** Company or establishment name (or part of it). */
  name: string
  /** 1 to 100; the API's default is 10. */
  limit?: number
  /** 0 or more; default 0. */
  offset?: number
}

/**
 * Filters for find / findNumbers. Give at least one of nace, zipcode,
 * municipality, street or name. NACE and address filters must match the
 * same unit: the registered office or one establishment.
 */
export interface CompanyFilters {
  /** NACE code prefix (2 to 7 digits, dots allowed), or up to 10. */
  nace?: string | string[]
  /** Code list the NACE codes refer to; the API's default is 2025. */
  naceVersion?: 2008 | 2025
  /** Belgian postcode (4 digits), or up to 20. */
  zipcode?: string | string[]
  /** Dutch or French name; case and accents are ignored. */
  municipality?: string
  /** Dutch or French name; needs zipcode or municipality. Natural persons are left out when street or houseNumber is used. */
  street?: string
  /** Needs street. */
  houseNumber?: string
  /** Company or establishment name (or part of it). */
  name?: string
  /** Legal form codes. */
  juridicalForm?: number[]
  /** Legal situation codes. */
  juridicalSituation?: string[]
  /** 0 or more; offset + limit must not exceed 10000. */
  offset?: number
}

export interface CompanyFindParams extends CompanyFilters {
  /** 1 to 100; the API's default is 10. */
  limit?: number
}

export interface CompanyFindNumbersParams extends CompanyFilters {
  /** 1 to 1000; the API's default is 100. */
  limit?: number
}

/** Which units met the NACE and address filters. */
export interface CompanyMatch {
  registeredOffice: boolean
  establishments: string[]
}

export interface FoundCompany extends Company {
  match: CompanyMatch
}

export interface CompanyFindResult {
  data: FoundCompany[]
  meta: SearchMeta
}

export interface CompanyNumbersResult {
  /** Enterprise numbers, dotted form. */
  data: string[]
  meta: SearchMeta
}

export interface CBE2JSONOptions {
  clientId: string
  secretKey: string
  /** Default: https://api.cbe2json.be */
  baseUrl?: string
  /** Milliseconds; default 10000. */
  timeout?: number
}
