"use client";

import { useMemo } from "react";
import { useOrgChart } from "@/hooks/useSalesTeam";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/providers/auth-provider";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrgChartView } from "@/components/org-chart/OrgChartView";
import { OrgChartSkeleton } from "@/components/skeletons";
import {
  resolveCurrentUserNodeId,
  shouldFocusOrgChartOnLogin,
} from "@/lib/org-chart-utils";

export default function OrgChartPage(): React.ReactElement {
  const { data, isLoading, isError, error } = useOrgChart();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { user } = useAuth();

  const focusOnLogin = shouldFocusOrgChartOnLogin(
    user?.role,
    profile?.salesTeam?.employeeCode,
  );
  const waitingForProfile = focusOnLogin && profileLoading;

  const focusNodeId = useMemo<string | undefined>(() => {
    if (!data || !user) return undefined;
    return resolveCurrentUserNodeId(
      data,
      profile?.salesTeam?.employeeCode,
      user.role,
      user.email,
    );
  }, [data, profile, user]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <PageHeader
        title="Organisation Chart"
        subtitle="Live hierarchy from Roinet Cognitensor API"
      />

      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        {(isLoading || waitingForProfile) && <OrgChartSkeleton />}

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

        {!isLoading && !waitingForProfile && !isError && data && data.length === 0 && (
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

        {!isLoading && !waitingForProfile && !isError && data && data.length > 0 && (
          <OrgChartView
            data={data}
            focusNodeId={focusOnLogin ? focusNodeId : undefined}
            focusOnLogin={focusOnLogin && !!focusNodeId}
          />
        )}
      </div>
    </div>
  );
}
