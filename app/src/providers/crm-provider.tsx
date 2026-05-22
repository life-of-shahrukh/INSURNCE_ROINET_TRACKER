"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { crmApi } from "@/lib/api";
import { downloadCsv } from "@/lib/crm-calculations";
import type { Deal, DealInput, Posp, PospInput } from "@/lib/types";

interface CrmContextValue {
  deals: Deal[];
  posp: Posp[];
  loading: boolean;
  refresh: () => Promise<void>;
  saveDeal: (input: DealInput) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  savePosp: (input: PospInput) => Promise<void>;
  exportCsv: () => Promise<void>;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [posp, setPosp] = useState<Posp[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const state = await crmApi.getState();
      setDeals(state.deals);
      setPosp(state.posp);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveDeal = useCallback(
    async (input: DealInput) => {
      if (input.id) {
        await crmApi.updateDeal(input.id, input);
      } else {
        await crmApi.createDeal(input);
      }
      await refresh();
    },
    [refresh],
  );

  const deleteDeal = useCallback(
    async (id: string) => {
      await crmApi.deleteDeal(id);
      await refresh();
    },
    [refresh],
  );

  const savePosp = useCallback(
    async (input: PospInput) => {
      if (input.id) {
        await crmApi.updatePosp(input.id, input);
      } else {
        await crmApi.createPosp(input);
      }
      await refresh();
    },
    [refresh],
  );

  const exportCsv = useCallback(async () => {
    const csv = await crmApi.exportDealsCsv();
    downloadCsv(csv);
  }, []);

  const value = useMemo(
    () => ({
      deals,
      posp,
      loading,
      refresh,
      saveDeal,
      deleteDeal,
      savePosp,
      exportCsv,
    }),
    [deals, posp, loading, refresh, saveDeal, deleteDeal, savePosp, exportCsv],
  );

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm(): CrmContextValue {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used within CrmProvider");
  return ctx;
}
