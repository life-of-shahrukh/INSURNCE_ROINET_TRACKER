import { keepPreviousData } from "@tanstack/react-query";

/** Keep prior rows visible while filters/pagination/search refetch. */
export const LIST_QUERY_OPTIONS = {
  placeholderData: keepPreviousData,
} as const;
