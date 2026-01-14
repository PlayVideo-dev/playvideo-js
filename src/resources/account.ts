/**
 * Account Resource
 */

import type { HttpClient } from "../http.js";
import type {
  Account,
  UpdateAccountParams,
  UpdateAccountResponse,
} from "../types.js";

export class AccountResource {
  constructor(private http: HttpClient) {}

  /**
   * Get account information
   */
  async get(): Promise<Account> {
    return this.http.get<Account>("/account");
  }

  /**
   * Update account settings
   */
  async update(params: UpdateAccountParams): Promise<UpdateAccountResponse> {
    return this.http.patch<UpdateAccountResponse>("/account", params);
  }
}
