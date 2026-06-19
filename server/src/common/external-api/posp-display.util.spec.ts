import { formatPospLabel, resolvePospDisplayName } from './posp-display.util';

describe('resolvePospDisplayName', () => {
  it('prefers username over UserCode', () => {
    expect(
      resolvePospDisplayName({
        username: 'SHIVRAJ GANGADHARRAO WANOLE',
        UserCode: 'CSP023057',
      }),
    ).toBe('SHIVRAJ GANGADHARRAO WANOLE');
  });

  it('falls back to UserCode when username is missing', () => {
    expect(resolvePospDisplayName({ UserCode: 'CSP023057' })).toBe('CSP023057');
  });
});

describe('formatPospLabel', () => {
  it('shows name and code together', () => {
    expect(formatPospLabel('SHIVRAJ WANOLE', 'CSP023057')).toBe(
      'SHIVRAJ WANOLE (CSP023057)',
    );
  });

  it('shows code only when name matches code', () => {
    expect(formatPospLabel('CSP023057', 'CSP023057')).toBe('CSP023057');
  });
});
