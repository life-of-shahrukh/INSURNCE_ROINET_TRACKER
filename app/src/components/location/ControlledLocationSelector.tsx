/**
 * ControlledLocationSelector
 *
 * A controlled, form-friendly version of the cascading location selector.
 * Accepts value props instead of reading from global UI store.
 */

'use client';

import { useLocationCascade } from '@/hooks/useExternalApi';

export interface LocationValue {
  stateId: string | null;
  stateName: string | null;
  districtId: string | null;
  districtName: string | null;
  cityId: string | null;
  cityName: string | null;
}

interface ControlledLocationSelectorProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}

export function ControlledLocationSelector({ value, onChange }: ControlledLocationSelectorProps) {
  const { states, districts, cities } = useLocationCascade(value.stateId, value.districtId);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    const state = states.data.find((s) => s.StateId === id);
    onChange({ stateId: id, stateName: state?.StateName ?? null, districtId: null, districtName: null, cityId: null, cityName: null });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    const district = districts.data.find((d) => d.DistrictId === id);
    onChange({ ...value, districtId: id, districtName: district?.DistrictName ?? null, cityId: null, cityName: null });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null;
    const city = cities.data.find((c) => c.CityId === id);
    onChange({ ...value, cityId: id, cityName: city?.CityName ?? null });
  };

  return (
    <div style={{ display: "contents" }}>
      <div className="form-group">
        <label htmlFor="loc-state">State</label>
        <select
          id="loc-state"
          value={value.stateId ?? ''}
          onChange={handleStateChange}
          disabled={states.isLoading}
        >
          <option value="">{states.isLoading ? 'Loading…' : 'Select state'}</option>
          {states.data.map((s) => (
            <option key={s.StateId} value={s.StateId}>{s.StateName}</option>
          ))}
        </select>
        {states.error && <span style={{ fontSize: 11, color: "var(--hot)" }}>Error loading states</span>}
      </div>

      <div className="form-group">
        <label htmlFor="loc-district">District</label>
        <select
          id="loc-district"
          value={value.districtId ?? ''}
          onChange={handleDistrictChange}
          disabled={!value.stateId || districts.isLoading}
        >
          <option value="">
            {!value.stateId ? 'Select state first' : districts.isLoading ? 'Loading…' : 'Select district'}
          </option>
          {districts.data.map((d) => (
            <option key={d.DistrictId} value={d.DistrictId}>{d.DistrictName}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="loc-city">City</label>
        <select
          id="loc-city"
          value={value.cityId ?? ''}
          onChange={handleCityChange}
          disabled={!value.districtId || cities.isLoading}
        >
          <option value="">
            {!value.districtId ? 'Select district first' : cities.isLoading ? 'Loading…' : 'Select city'}
          </option>
          {cities.data.map((c) => (
            <option key={c.CityId} value={c.CityId}>{c.CityName}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
