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
import { useQueryClient } from "@tanstack/react-query";
import { crmApi } from "@/lib/api";
import { dealKeys } from "@/hooks/useDealsList";
import { pospKeys } from "@/hooks/usePospList";
import { downloadCsv } from "@/lib/crm-calculations";
import type { Deal, DealInput, Posp, PospInput } from "@/lib/types";
import { useAuth } from "./auth-provider";

interface CrmContextValue {
  deals: Deal[];
  posp: Posp[];
  loading: boolean;
  refresh: () => Promise<void>;
  saveDeal: (input: DealInput) => Promise<Deal>;
  deleteDeal: (id: string) => Promise<void>;
  savePosp: (input: PospInput) => Promise<void>;
  exportCsv: (params?: URLSearchParams) => Promise<void>;
}

const CrmContext = createContext<CrmContextValue | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [posp, setPosp] = useState<Posp[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setDeals([]);
      setPosp([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const state = await crmApi.getState();
      setDeals(state.deals);
      setPosp(state.posp);
    } catch (err) {
      console.error("[CRM] Failed to load state:", err);
      setDeals([]);
      setPosp([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveDeal = useCallback(
    async (input: DealInput): Promise<Deal> => {
      const savedDeal = input.id
        ? await crmApi.updateDeal(input.id, input)
        : await crmApi.createDeal(input);
      // Refresh state in background — don't let a refresh failure mask success.
      void refresh();
      void queryClient.invalidateQueries({ queryKey: dealKeys.all });
      return savedDeal;
    },
    [refresh, queryClient],
  );

  const deleteDeal = useCallback(
    async (id: string) => {
      await crmApi.deleteDeal(id);
      await refresh();
      await queryClient.invalidateQueries({ queryKey: dealKeys.all });
    },
    [refresh, queryClient],
  );

  const savePosp = useCallback(
    async (input: PospInput) => {
      if (input.id) {
        await crmApi.updatePosp(input.id, input);
      } else {
        await crmApi.createPosp(input);
      }
      await refresh();
      await queryClient.invalidateQueries({ queryKey: pospKeys.all });
    },
    [refresh, queryClient],
  );

  const exportCsv = useCallback(async (params?: URLSearchParams) => {
    const csv = await crmApi.exportDealsCsv(params);
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
