import { request } from './fetch-client';

export const otpApi = {
  send(mobile: string): Promise<{ requestId: string }> {
    return request<{ requestId: string }>('/api/otp/send', {
      method: 'POST',
      body: JSON.stringify({ mobile }),
    });
  },

  verify(
    requestId: string,
    code: string,
    customerId: string,
  ): Promise<{ verified: boolean }> {
    return request<{ verified: boolean }>('/api/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ requestId, code, customerId }),
    });
  },
};
