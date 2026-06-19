import { useQuery } from "@tanstack/react-query";
import {
  EMPTY_GEO_CATALOG,
  geoCatalogApi,
  type GeoCatalog,
} from "@/lib/api/geo-catalog-api";

/**
 * Small geo reference lists (zones/regions/states), fetched once per session.
 * Big lists (districts/cities) are searched server-side instead of loaded here.
 */
export function useGeoCatalog() {
  return useQuery<GeoCatalog>({
    queryKey: ["geo", "catalog"],
    queryFn: () => geoCatalogApi.getCatalog(),
    staleTime: Infinity,
    gcTime: Infinity,
    placeholderData: EMPTY_GEO_CATALOG,
  });
}
