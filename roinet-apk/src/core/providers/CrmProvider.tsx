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
  addBulletinPost,
  createDeal,
  createPosp,
  deleteBulletinPost,
  deleteDeal,
  exportDealsCsv,
  getCrmState,
  updateDeal,
  updatePosp,
} from '@/features/deals/services';
import type {
  BulletinPost,
  Deal,
  DealInput,
  FieldVisit,
  Manager,
  Posp,
  PospInput,
  QuoteRequest,
  RecruitmentTargets,
  StrategicAccount,
} from '@/shared/types/crm.types';

interface CrmContextValue {
  deals: Deal[];
  allDeals: Deal[];
  posp: Posp[];
  managers: Manager[];
  targets: RecruitmentTargets;
  visits: FieldVisit[];
  strategic: StrategicAccount[];
  quotes: QuoteRequest[];
  bulletin: BulletinPost[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveDeal: (input: DealInput) => Promise<void>;
  deleteDealById: (id: string) => Promise<void>;
  savePosp: (input: PospInput) => Promise<void>;
  postBulletin: (text: string, author: string) => Promise<void>;
  removeBulletin: (id: string) => Promise<void>;
  exportCsv: () => Promise<string>;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [posp, setPosp] = useState<Posp[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [targets, setTargets] = useState<RecruitmentTargets>({ asm: {} });
  const [visits, setVisits] = useState<FieldVisit[]>([]);
  const [strategic, setStrategic] = useState<StrategicAccount[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [bulletin, setBulletin] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setDeals([]);
      setPosp([]);
      setManagers([]);
      setTargets({ asm: {} });
      setVisits([]);
      setStrategic([]);
      setQuotes([]);
      setBulletin([]);
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
      setManagers(state.managers);
      setTargets(state.targets);
      setVisits(state.visits);
      setStrategic(state.strategic);
      setQuotes(state.quotes);
      setBulletin(state.bulletin);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load CRM data';
      console.error('[CRM] Failed to load state:', err);
      setDeals([]);
      setPosp([]);
      setManagers([]);
      setTargets({ asm: {} });
      setVisits([]);
      setStrategic([]);
      setQuotes([]);
      setBulletin([]);
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

  const postBulletin = useCallback(
    async (text: string, author: string) => {
      await addBulletinPost({ text, author, date: new Date().toISOString().slice(0, 10) });
      await refresh();
    },
    [refresh],
  );

  const removeBulletin = useCallback(
    async (id: string) => {
      await deleteBulletinPost(id);
      await refresh();
    },
    [refresh],
  );

  const exportCsv = useCallback(async () => exportDealsCsv(), []);

  const value = useMemo(() => {
    const scopedDeals =
      !user || user.role === 'ADMIN'
        ? deals
        : user.pospId
          ? deals.filter((d) => d.pospId === user.pospId)
          : [];

    return {
      deals: scopedDeals,
      allDeals: deals,
      posp,
      managers,
      targets,
      visits,
      strategic,
      quotes,
      bulletin,
      loading,
      error,
      refresh,
      saveDeal,
      deleteDealById,
      savePosp,
      postBulletin,
      removeBulletin,
      exportCsv,
    };
  }, [
    deals,
    posp,
    managers,
    targets,
    visits,
    strategic,
    quotes,
    bulletin,
    loading,
    error,
    refresh,
    saveDeal,
    deleteDealById,
    savePosp,
    postBulletin,
    removeBulletin,
    exportCsv,
    user,
  ]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used within CrmProvider');
  return ctx;
}
