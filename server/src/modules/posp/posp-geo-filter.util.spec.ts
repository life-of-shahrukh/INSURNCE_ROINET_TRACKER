import { buildPospGeoFilterWhere } from './posp-geo-filter.util';

describe('buildPospGeoFilterWhere', () => {
  it('filters POSP roster picks by id, not pospId', () => {
    expect(buildPospGeoFilterWhere({ posp: ['p1', 'p2'] })).toEqual({
      id: { in: ['p1', 'p2'] },
    });
  });

  it('filters cities by POSP.cityId', () => {
    expect(buildPospGeoFilterWhere({ city: ['city-a'] })).toEqual({
      cityId: { in: ['city-a'] },
    });
  });

  it('merges legacy cityId param into city filter', () => {
    expect(
      buildPospGeoFilterWhere({ city: ['city-a'], cityId: 'city-b' }),
    ).toEqual({
      cityId: { in: ['city-a', 'city-b'] },
    });
  });

  it('uses direct district selection when district[] is set', () => {
    expect(
      buildPospGeoFilterWhere({ district: ['d1'] }, ['d1', 'd2']),
    ).toEqual({
      districtId: { in: ['d1'] },
    });
  });

  it('falls back to stateId when state is selected and districtId is null', () => {
    expect(
      buildPospGeoFilterWhere({ state: ['st1'] }, ['d1', 'd2']),
    ).toEqual({
      OR: [
        { districtId: { in: ['d1', 'd2'] } },
        { districtId: null, stateId: { in: ['st1'] } },
      ],
    });
  });

  it('uses districtIds only when no explicit state fallback is needed', () => {
    expect(buildPospGeoFilterWhere({}, ['d1'])).toEqual({
      districtId: { in: ['d1'] },
    });
  });

  it('combines cityId precision with district resolution', () => {
    expect(
      buildPospGeoFilterWhere({ city: ['city-a'] }, ['d1']),
    ).toEqual({
      AND: [
        { cityId: { in: ['city-a'] } },
        { districtId: { in: ['d1'] } },
      ],
    });
  });
});
