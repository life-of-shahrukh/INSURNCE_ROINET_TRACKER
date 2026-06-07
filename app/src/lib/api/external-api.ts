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
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(`${EXTERNAL_API_BASE}${endpoint}`, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
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

    return await response.json();
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
    return externalApiRequest<State[]>('/Cognitensor/ListState', {
      body: '',
    });
  },

  /**
   * Get districts for a specific state
   */
  async getDistricts(stateId: string): Promise<District[]> {
    const request: ListDistrictRequest = { stateid: stateId };
    return externalApiRequest<District[]>('/Cognitensor/ListDistrict', {
      body: JSON.stringify(request),
    });
  },

  /**
   * Get cities for a specific district
   */
  async getCities(districtId: string): Promise<City[]> {
    const request: ListCityRequest = { districtid: districtId };
    return externalApiRequest<City[]>('/Cognitensor/ListCity', {
      body: JSON.stringify(request),
    });
  },

  /**
   * Get hierarchy user data
   */
  async getHierarchyUserData(): Promise<HierarchyUser[]> {
    return externalApiRequest<HierarchyUser[]>(
      '/Cognitensor/ListHierarchyUserData',
      {
        body: '',
      },
    );
  },
};

export { ExternalApiError };
