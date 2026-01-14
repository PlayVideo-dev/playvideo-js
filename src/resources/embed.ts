/**
 * Embed Resource
 */

import type { HttpClient } from "../http.js";
import type {
  EmbedSettings,
  UpdateEmbedSettingsParams,
  UpdateEmbedSettingsResponse,
  SignEmbedParams,
  SignEmbedResponse,
} from "../types.js";

export class EmbedResource {
  constructor(private http: HttpClient) {}

  /**
   * Get current embed settings
   */
  async getSettings(): Promise<EmbedSettings> {
    return this.http.get<EmbedSettings>("/embed/settings");
  }

  /**
   * Update embed settings
   */
  async updateSettings(params: UpdateEmbedSettingsParams): Promise<UpdateEmbedSettingsResponse> {
    return this.http.patch<UpdateEmbedSettingsResponse>("/embed/settings", params);
  }

  /**
   * Generate a signed embed URL for a video
   */
  async sign(params: SignEmbedParams): Promise<SignEmbedResponse> {
    return this.http.post<SignEmbedResponse>("/embed/sign", params);
  }
}
