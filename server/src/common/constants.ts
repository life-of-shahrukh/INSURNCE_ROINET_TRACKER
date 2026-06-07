/** String constants replacing Prisma enums (removed for MS SQL compatibility). */

export const Role = {
  ADMIN: 'ADMIN',
  POSP: 'POSP',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

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
