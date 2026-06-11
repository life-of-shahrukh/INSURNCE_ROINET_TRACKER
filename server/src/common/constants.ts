/** String constants replacing Prisma enums (removed for MS SQL compatibility). */

/**
 * Role hierarchy (highest to lowest privilege):
 * SUPER_ADMIN > NATIONAL_HEAD (R4) > ZH (R3) > RH (R2) > ASM (R1) > DM > POSP
 */
export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN', // Full system access
  NATIONAL_HEAD: 'NATIONAL_HEAD', // R4 — national view, no system config
  ZH: 'ZH', // R3 — Zonal Head
  RH: 'RH', // R2 — Regional Head
  ASM: 'ASM', // R1 — Area Sales Manager
  DM: 'DM', // District Manager
  POSP: 'POSP', // Point of Sales Person (field agent)
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/**
 * Numeric rank — higher = more privilege.
 * Used for hierarchical access checks (a higher-ranked role can access
 * anything a lower-ranked role can).
 */
export const ROLE_RANK: Record<Role, number> = {
  SUPER_ADMIN: 100,
  NATIONAL_HEAD: 80,
  ZH: 60,
  RH: 40,
  ASM: 20,
  DM: 10,
  POSP: 5,
};

export const UserStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const DealStatus = {
  H: 'H',
  W: 'W',
  C: 'C',
} as const;
export type DealStatus = (typeof DealStatus)[keyof typeof DealStatus];
