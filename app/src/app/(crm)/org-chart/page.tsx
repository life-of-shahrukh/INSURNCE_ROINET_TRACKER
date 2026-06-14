"use client";

import { useMemo } from "react";
import { useOrgChart } from "@/hooks/useSalesTeam";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrgChartView } from "@/components/org-chart/OrgChartView";
import type { OrgNode } from "@/lib/api/sales-team-api";

/** Map app roles to Cognitensor designation codes so we can do a fallback
 *  lookup when the user has no SalesTeam record. */
const ROLE_TO_DESIGNATION: Record<string, string> = {
  NATIONAL_HEAD: "R5",
  ZH:            "R4",
  RH:            "R3",
  ASM:           "R2",
  DM:            "DM",
};

function resolveCurrentUserNodeId(
  nodes: OrgNode[],
  employeeCode: string | undefined,
  role: string,
): string | undefined {
  // 1. Exact match by employeeCode from the user's SalesTeam profile.
  if (employeeCode) {
    const match = nodes.find(
      (n) => n.employeeCode.toLowerCase() === employeeCode.toLowerCase(),
    );
    if (match) return match.id;
  }

  // 2. Fallback: first node whose designation matches the user's role.
  const designation = ROLE_TO_DESIGNATION[role];
  if (designation) {
    const match = nodes.find((n) => n.designation === designation);
    if (match) return match.id;
  }

  return undefined;
}

export default function OrgChartPage(): React.ReactElement {
  const { data, isLoading, isError, error } = useOrgChart();
  const { data: profile } = useProfile();
  const { user } = useAuth();

  const currentUserNodeId = useMemo<string | undefined>(() => {
    if (!data || !user) return undefined;
    return resolveCurrentUserNodeId(
      data,
      profile?.salesTeam?.employeeCode,
      user.role,
    );
  }, [data, profile, user]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <PageHeader
        title="Organisation Chart"
        subtitle="Live hierarchy from Roinet Cognitensor API"
      />

      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        {isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            Loading hierarchy data…
          </div>
        )}

        {isError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#dc2626",
              fontSize: 14,
            }}
          >
            Failed to load org chart:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        )}

        {!isLoading && !isError && data && data.length === 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            No hierarchy data returned by the API.
          </div>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <OrgChartView data={data} currentUserNodeId={currentUserNodeId} />
        )}
      </div>
    </div>
  );
}
