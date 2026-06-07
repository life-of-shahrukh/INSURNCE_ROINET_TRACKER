/**
 * Location Selector Component
 * 
 * Cascading select for State -> District -> City
 * Uses external RoiNet Cognitensor API
 */

'use client';

import { useLocationCascade } from '@/hooks/useExternalApi';
import { useUIStore } from '@/store/ui-store';

interface LocationSelectorProps {
  onLocationChange?: (location: {
    stateId: string | null;
    districtId: string | null;
    cityId: string | null;
  }) => void;
  className?: string;
}

export function LocationSelector({
  onLocationChange,
  className = '',
}: LocationSelectorProps) {
  const {
    selectedState,
    selectedDistrict,
    selectedCity,
    setSelectedState,
    setSelectedDistrict,
    setSelectedCity,
    resetLocationSelection,
  } = useUIStore();

  const { states, districts, cities } = useLocationCascade(
    selectedState,
    selectedDistrict,
  );

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    setSelectedState(value);
    onLocationChange?.({
      stateId: value,
      districtId: null,
      cityId: null,
    });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    setSelectedDistrict(value);
    onLocationChange?.({
      stateId: selectedState,
      districtId: value,
      cityId: null,
    });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    setSelectedCity(value);
    onLocationChange?.({
      stateId: selectedState,
      districtId: selectedDistrict,
      cityId: value,
    });
  };

  const handleReset = () => {
    resetLocationSelection();
    onLocationChange?.({
      stateId: null,
      districtId: null,
      cityId: null,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* State Selector */}
      <div>
        <label
          htmlFor="state"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          State
        </label>
        <select
          id="state"
          value={selectedState ?? ''}
          onChange={handleStateChange}
          disabled={states.isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {states.isLoading ? 'Loading states...' : 'Select a state'}
          </option>
          {states.data.map((state) => (
            <option key={state.id} value={state.id}>
              {state.name}
            </option>
          ))}
        </select>
        {states.error && (
          <p className="mt-1 text-sm text-red-600">
            Error loading states: {states.error.message}
          </p>
        )}
      </div>

      {/* District Selector */}
      <div>
        <label
          htmlFor="district"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          District
        </label>
        <select
          id="district"
          value={selectedDistrict ?? ''}
          onChange={handleDistrictChange}
          disabled={!selectedState || districts.isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {!selectedState
              ? 'Select a state first'
              : districts.isLoading
                ? 'Loading districts...'
                : 'Select a district'}
          </option>
          {districts.data.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name}
            </option>
          ))}
        </select>
        {districts.error && (
          <p className="mt-1 text-sm text-red-600">
            Error loading districts: {districts.error.message}
          </p>
        )}
      </div>

      {/* City Selector */}
      <div>
        <label
          htmlFor="city"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          City
        </label>
        <select
          id="city"
          value={selectedCity ?? ''}
          onChange={handleCityChange}
          disabled={!selectedDistrict || cities.isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {!selectedDistrict
              ? 'Select a district first'
              : cities.isLoading
                ? 'Loading cities...'
                : 'Select a city'}
          </option>
          {cities.data.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {cities.error && (
          <p className="mt-1 text-sm text-red-600">
            Error loading cities: {cities.error.message}
          </p>
        )}
      </div>

      {/* Reset Button */}
      {(selectedState || selectedDistrict || selectedCity) && (
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Reset selection
        </button>
      )}
    </div>
  );
}
