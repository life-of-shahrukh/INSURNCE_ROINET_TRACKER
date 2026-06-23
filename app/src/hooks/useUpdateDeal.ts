import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crmApi } from "@/lib/api";
import { dealKeys } from "@/hooks/useDealsList";
import { dashboardStatKeys } from "@/hooks/useDashboardStats";
import type { Deal, DealInput } from "@/lib/types";

interface UpdateDealVariables {
  id: string;
  data: DealInput;
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation<Deal, Error, UpdateDealVariables>({
    mutationFn: ({ id, data }) => crmApi.updateDeal(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: dealKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardStatKeys.all }),
      ]);
    },
  });
}
