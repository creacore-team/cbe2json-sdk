import { post, type HttpConfig } from './http'
import type {
  CompanyResult,
  CompanySearchParams,
  CompanySearchResult,
} from './types'

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
}
