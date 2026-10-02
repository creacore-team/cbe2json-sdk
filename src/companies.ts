import { post, type HttpConfig } from './http'
import type {
  CompanyFindNumbersParams,
  CompanyFindParams,
  CompanyFindResult,
  CompanyNumbersResult,
  CompanyResult,
  CompanySearchParams,
  CompanySearchResult,
} from './types'

// The API validates the filters; this only drops undefined values so they
// are not sent, and refuses a missing params object early.
function filtersBody(
  params: object | undefined,
  method: string,
): Record<string, unknown> {
  if (params === null || typeof params !== 'object') {
    throw new TypeError(`CBE2JSON: ${method} needs filters`)
  }
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  )
}

/** Company lookups: `cbe.companies`. */
export class Companies {
  // Private field: keeps the credentials out of console.log / inspect output.
  readonly #config: HttpConfig

  constructor(config: HttpConfig) {
    this.#config = config
  }

  /**
   * One company by enterprise number. Accepted formats: "0202.239.951",
   * "0202239951", "BE0202239951", "BE 0202.239.951", and 9-digit numbers.
   * Uses 1 credit. Throws NotFoundError (no credit used) for an unknown number.
   */
  async get(enterpriseNumber: string): Promise<CompanyResult> {
    if (typeof enterpriseNumber !== 'string') {
      throw new TypeError('CBE2JSON: enterpriseNumber must be a string')
    }
    return post<CompanyResult>(this.#config, 'byCBE', {
      cbe: enterpriseNumber.trim(),
    })
  }

  /**
   * Companies whose name (or an establishment's name) contains `name`.
   * Uses 1 credit per company returned; an empty result costs nothing.
   */
  async search(params: CompanySearchParams): Promise<CompanySearchResult> {
    if (typeof params?.name !== 'string') {
      throw new TypeError('CBE2JSON: search needs a name')
    }
    const data: Record<string, unknown> = { denomination: params.name }
    if (params.limit !== undefined) data.limit = params.limit
    if (params.offset !== undefined) data.offset = params.offset
    return post<CompanySearchResult>(this.#config, 'byDenomination', data)
  }

  /**
   * Companies by activity (NACE), postcode, municipality, street and house
   * number, name, legal form or legal situation.
   * Uses 1 credit per company returned; an empty result costs nothing.
   */
  async find(params: CompanyFindParams): Promise<CompanyFindResult> {
    return post<CompanyFindResult>(
      this.#config,
      'search',
      filtersBody(params, 'find'),
    )
  }

  /**
   * Same filters as find; returns enterprise numbers only, up to 1000 per
   * page. Uses 1 credit per page with results.
   */
  async findNumbers(
    params: CompanyFindNumbersParams,
  ): Promise<CompanyNumbersResult> {
    return post<CompanyNumbersResult>(
      this.#config,
      'search/numbers',
      filtersBody(params, 'findNumbers'),
    )
  }
}
