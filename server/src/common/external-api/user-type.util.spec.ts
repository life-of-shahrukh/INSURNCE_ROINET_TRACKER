import {
  OrgRole,
  VIVEK_USER_CODE,
  appRoleFromOrgRole,
  mergeOrgRole,
  orgRoleFromUserType,
  orgRoleLabel,
  refineAdminRoles,
} from './user-type.util';

describe('mergeOrgRole', () => {
  it('keeps the more senior role', () => {
    expect(mergeOrgRole(OrgRole.RH, OrgRole.SZH)).toBe(OrgRole.SZH);
    expect(mergeOrgRole(OrgRole.SZH, OrgRole.RH)).toBe(OrgRole.SZH);
    expect(mergeOrgRole(OrgRole.ADMIN, OrgRole.ZH)).toBe(OrgRole.ADMIN);
  });
});

describe('orgRoleFromUserType', () => {
  it('maps Cognitensor usertype integers', () => {
    expect(orgRoleFromUserType(0)).toBe(OrgRole.ADMIN);
    expect(orgRoleFromUserType(14)).toBe(OrgRole.SZH);
    expect(orgRoleFromUserType(10)).toBe(OrgRole.ZH);
    expect(orgRoleFromUserType('6')).toBe(OrgRole.RH);
  });
});

describe('refineAdminRoles', () => {
  const vivekId = '79';
  const hariId = '592240';
  const sachinId = '57068';

  it('keeps VIVEK as Admin and promotes HARI.DUTT to National Head', () => {
    const members = [
      {
        userId: vivekId,
        userCode: VIVEK_USER_CODE,
        role: OrgRole.ADMIN,
      },
      {
        userId: hariId,
        userCode: 'HARI.DUTT',
        role: OrgRole.ADMIN,
      },
    ];
    const edges = [{ memberUserId: hariId, managerUserId: vivekId }];

    refineAdminRoles(members, edges);

    expect(members[0].role).toBe(OrgRole.ADMIN);
    expect(members[1].role).toBe(OrgRole.NATIONAL_HEAD);
  });

  it('maps SACHIN to SZH via merge (usertype 14)', () => {
    expect(mergeOrgRole(OrgRole.RH, OrgRole.SZH)).toBe(OrgRole.SZH);
    expect(orgRoleFromUserType(14)).toBe(OrgRole.SZH);
    expect(appRoleFromOrgRole(OrgRole.SZH)).toBe('ZH');
  });

  it('labels National Head for display', () => {
    expect(orgRoleLabel(OrgRole.NATIONAL_HEAD)).toBe('National Head');
    expect(orgRoleLabel(OrgRole.ADMIN)).toBe('Admin');
    expect(orgRoleLabel(OrgRole.SZH)).toBe('Super Zonal Head');
  });
});
