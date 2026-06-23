import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "@/lib/api";
import { dealKeys } from "@/hooks/useDealsList";
import { leadKeys } from "@/hooks/useLeads";
import { dashboardStatKeys } from "@/hooks/useDashboardStats";

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => crmApi.deleteDeal(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dealKeys.all }),
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardStatKeys.all }),
      ]);
    },
  });
}
