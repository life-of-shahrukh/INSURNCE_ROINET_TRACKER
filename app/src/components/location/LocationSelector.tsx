"use client";

import { useEffect, useState } from "react";
import { useLocationCascade } from "@/hooks/useExternalApi";

interface LocationValue {
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  cityId: string;
  cityName: string;
}

interface LocationSelectorProps {
  /** Current values — drives the dropdowns (controlled). */
  value: LocationValue;
  onChange: (location: LocationValue) => void;
}

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  // Local "selected" IDs for cascading — initialised from value prop.
  const [stateId, setStateId] = useState(value.stateId);
  const [districtId, setDistrictId] = useState(value.districtId);

  // Re-sync when the parent value changes (e.g. modal opens for a new customer)
  useEffect(() => {
    setStateId(value.stateId);
    setDistrictId(value.districtId);
  }, [value.stateId, value.districtId]);

  const { states, districts, cities } = useLocationCascade(
    stateId || null,
    districtId || null,
  );

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const id = e.target.value;
    const name = states.data.find((s) => s.StateId === id)?.StateName ?? "";
    setStateId(id);
    setDistrictId("");
    onChange({ stateId: id, stateName: name, districtId: "", districtName: "", cityId: "", cityName: "" });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const id = e.target.value;
    const name = districts.data.find((d) => d.DistrictId === id)?.DistrictName ?? "";
    setDistrictId(id);
    onChange({ ...value, stateId, districtId: id, districtName: name, cityId: "", cityName: "" });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const id = e.target.value;
    const name = cities.data.find((c) => c.CityId === id)?.CityName ?? "";
    onChange({ ...value, stateId, districtId, cityId: id, cityName: name });
  };

  return (
    <div className="form-grid">
      <div className="form-group">
        <label htmlFor="loc-state">State</label>
        <select
          id="loc-state"
          value={stateId}
          onChange={handleStateChange}
          disabled={states.isLoading}
        >
          <option value="">{states.isLoading ? "Loading…" : "— Select state —"}</option>
          {states.data.map((s) => (
            <option key={s.StateId} value={s.StateId}>{s.StateName}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="loc-district">District</label>
        <select
          id="loc-district"
          value={districtId}
          onChange={handleDistrictChange}
          disabled={!stateId || districts.isLoading}
        >
          <option value="">
            {stateId
              ? districts.isLoading ? "Loading…" : "— Select district —"
              : "Select state first"}
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
          value={value.cityId}
          onChange={handleCityChange}
          disabled={!districtId || cities.isLoading}
        >
          <option value="">
            {districtId
              ? cities.isLoading ? "Loading…" : "— Select city —"
              : "Select district first"}
          </option>
          {cities.data.map((c) => (
            <option key={c.CityId} value={c.CityId}>{c.CityName}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
