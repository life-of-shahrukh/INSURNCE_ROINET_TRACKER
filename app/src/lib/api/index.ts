import type { CrmApi } from "./crm-api";
import { httpCrmApi } from "./http-crm-api";
import { mockCrmApi } from "./mock-crm-api";

const useMock =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_USE_MOCK !== "false"
    : process.env.NEXT_PUBLIC_USE_MOCK !== "false";

export const crmApi: CrmApi = useMock ? mockCrmApi : httpCrmApi;
