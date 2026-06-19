import { createPosp } from '@/features/deals/services/mock-deal-service';
import type { LoginPayload, LoginResponse, SignupPospPayload } from '@/features/auth/types/auth.types';
import { AuthApiError } from '@/features/auth/services/auth-errors';

const MOCK_ADMIN = {
  email: 'admin@roinet.com',
  password: 'Admin@1234',
};

export async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
  if (payload.email === MOCK_ADMIN.email && payload.password === MOCK_ADMIN.password) {
    return {
      accessToken: 'mock-admin-token',
      user: {
        id: 'admin-1',
        email: payload.email,
        role: 'ADMIN',
        status: 'ACTIVE',
        pospId: null,
      },
    };
  }

  if (payload.email.includes('@') && payload.password.length >= 6) {
    return {
      accessToken: 'mock-posp-token',
      user: {
        id: 'posp-user-1',
        email: payload.email,
        role: 'POSP',
        status: 'ACTIVE',
        pospId: 'p1',
      },
    };
  }

  throw new AuthApiError('Invalid credentials', 401);
}

export async function signupPospRequest(payload: SignupPospPayload): Promise<LoginResponse> {
  const pospId = `p_${Date.now()}`;

  await createPosp({
    id: pospId,
    name: payload.name,
    code: payload.code,
    mobile: payload.mobile,
    email: payload.email,
    joined: payload.joined,
    active: false,
    region: '',
    area: '',
    asm: '',
    rm: '',
  });

  return {
    accessToken: 'mock-posp-token',
    user: {
      id: `posp-user-${pospId}`,
      email: payload.email,
      role: 'POSP',
      status: 'PENDING',
      pospId,
    },
  };
}
