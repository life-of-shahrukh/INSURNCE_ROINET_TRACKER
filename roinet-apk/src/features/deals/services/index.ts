import { USE_MOCK } from '@/core/constants';
import * as http from './deal-service';
import * as mock from './mock-deal-service';

const svc = USE_MOCK ? mock : http;

export const getCrmState = svc.getCrmState;
export const createDeal = svc.createDeal;
export const updateDeal = svc.updateDeal;
export const deleteDeal = svc.deleteDeal;
export const createPosp = svc.createPosp;
export const updatePosp = svc.updatePosp;
export const exportDealsCsv = svc.exportDealsCsv;

export const addBulletinPost = USE_MOCK
  ? mock.addBulletinPost
  : async () => {
      throw new Error('Bulletin posts are only available in mock mode');
    };

export const deleteBulletinPost = USE_MOCK
  ? mock.deleteBulletinPost
  : async () => {
      throw new Error('Bulletin posts are only available in mock mode');
    };
