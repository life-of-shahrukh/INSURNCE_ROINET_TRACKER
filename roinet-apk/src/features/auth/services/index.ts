import { USE_MOCK } from '@/core/constants';
import * as http from './auth-service';
import * as mock from './mock-auth-service';

const svc = USE_MOCK ? mock : http;

export const loginRequest = svc.loginRequest;
export const signupPospRequest = svc.signupPospRequest;
