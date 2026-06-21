import { buildAuthUserPayload } from './auth-payload.util';
import { Role, UserStatus } from '../../common/constants';

describe('buildAuthUserPayload', () => {
  it('shows Cluster Head for CH org role while app role stays RH', () => {
    const payload = buildAuthUserPayload({
      id: 'u1',
      email: 'chintu.asmbihar@roinet.in',
      role: Role.RH,
      status: UserStatus.ACTIVE,
      pospId: null,
      salesTeam: { designation: 'CH' },
    });

    expect(payload.role).toBe(Role.RH);
    expect(payload.orgRole).toBe('CH');
    expect(payload.roleLabel).toBe('Cluster Head');
  });

  it('shows Super Zonal Head for SZH org role while app role is ZH', () => {
    const payload = buildAuthUserPayload({
      id: 'u2',
      email: 'sachin.zhrajgujmp@roinet.in',
      role: Role.ZH,
      status: UserStatus.ACTIVE,
      pospId: null,
      salesTeam: { designation: 'SZH' },
    });

    expect(payload.role).toBe(Role.ZH);
    expect(payload.roleLabel).toBe('Super Zonal Head');
  });

  it('shows Regional Head for RH app role without org designation', () => {
    const payload = buildAuthUserPayload({
      id: 'u3',
      email: 'shaikh.rhmaha@roinet.in',
      role: Role.RH,
      status: UserStatus.ACTIVE,
      pospId: null,
    });

    expect(payload.roleLabel).toBe('Regional Head');
    expect(payload.orgRole).toBeUndefined();
  });
});
