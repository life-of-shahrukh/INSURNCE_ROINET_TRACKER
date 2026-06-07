import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/core/providers/AuthProvider';
import {
  createDeal,
  createPosp,
  deleteDeal,
  exportDealsCsv,
  getCrmState,
  updateDeal,
  updatePosp,
} from '@/features/deals/services';
import type { Deal, DealInput, Posp, PospInput } from '@/shared/types/crm.types';

interface CrmContextValue {
  deals: Deal[];
  posp: Posp[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveDeal: (input: DealInput) => Promise<void>;
  deleteDealById: (id: string) => Promise<void>;
  savePosp: (input: PospInput) => Promise<void>;
  exportCsv: () => Promise<string>;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [posp, setPosp] = useState<Posp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setDeals([]);
      setPosp([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const state = await getCrmState();
      setDeals(state.deals);
      setPosp(state.posp);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load CRM data';
      console.error('[CRM] Failed to load state:', err);
      setDeals([]);
      setPosp([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveDeal = useCallback(
    async (input: DealInput) => {
      if (input.id) {
        await updateDeal(input.id, input);
      } else {
        await createDeal(input);
      }
      await refresh();
    },
    [refresh],
  );

  const deleteDealById = useCallback(
    async (id: string) => {
      await deleteDeal(id);
      await refresh();
    },
    [refresh],
  );

  const savePosp = useCallback(
    async (input: PospInput) => {
      if (input.id) {
        await updatePosp(input.id, input);
      } else {
        await createPosp(input);
      }
      await refresh();
    },
    [refresh],
  );

  const exportCsv = useCallback(async () => exportDealsCsv(), []);

  const value = useMemo(
    () => ({
      deals,
      posp,
      loading,
      error,
      refresh,
      saveDeal,
      deleteDealById,
      savePosp,
      exportCsv,
    }),
    [deals, posp, loading, error, refresh, saveDeal, deleteDealById, savePosp, exportCsv],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used within CrmProvider');
  return ctx;
}
