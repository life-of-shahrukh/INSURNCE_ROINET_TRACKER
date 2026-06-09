/**
 * RoiNet Cognitensor External API Client
 * 
 * This client handles all communication with the external
 * RoiNet Cognitensor API for location and hierarchy data.
 */

import type {
  State,
  District,
  City,
  HierarchyUser,
  ListDistrictRequest,
  ListCityRequest,
  CognitensorResponse,
} from '../external-api-types';

const EXTERNAL_API_BASE = 'https://uatserviceapi.roinet.in';

class ExternalApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'ExternalApiError';
  }
}

async function externalApiRequest<T>(
  endpoint: string,
  body?: object | string,
): Promise<T[]> {
  try {
    const response = await fetch(`${EXTERNAL_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: typeof body === 'string' ? body : JSON.stringify(body || {}),
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ExternalApiError(
        `API request failed: ${response.statusText}`,
        response.status,
        errorData,
      );
    }

    const wrapper: CognitensorResponse<T> = await response.json();
    
    // Check if API returned an error in the description
    if (wrapper.description !== 'success') {
      throw new ExternalApiError(
        `API Error: ${wrapper.description}`,
        response.status,
        wrapper,
      );
    }

    // Return the unwrapped Data array
    return wrapper.Data;
  } catch (error) {
    if (error instanceof ExternalApiError) {
      throw error;
    }
    throw new ExternalApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
    );
  }
}

/**
 * External API Client
 */
export const externalApi = {
  /**
   * Get list of all states
   */
  async getStates(): Promise<State[]> {
    return externalApiRequest<State>('/Cognitensor/ListState', '');
  },

  /**
   * Get districts for a specific state
   */
  async getDistricts(stateId: string): Promise<District[]> {
    const request: ListDistrictRequest = { stateid: stateId };
    return externalApiRequest<District>('/Cognitensor/ListDistrict', request);
  },

  /**
   * Get cities for a specific district
   */
  async getCities(districtId: string): Promise<City[]> {
    const request: ListCityRequest = { districtid: districtId };
    return externalApiRequest<City>('/Cognitensor/ListCity', request);
  },

  /**
   * Get hierarchy user data
   */
  async getHierarchyUserData(): Promise<HierarchyUser[]> {
    return externalApiRequest<HierarchyUser>(
      '/Cognitensor/ListHierarchyUserData',
      '',
    );
  },
};

export { ExternalApiError };
