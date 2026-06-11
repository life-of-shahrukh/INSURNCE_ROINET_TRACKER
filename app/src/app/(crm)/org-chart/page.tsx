"use client";

import { useOrgChart } from "@/hooks/useSalesTeam";
import { PageHeader } from "@/components/ui/PageHeader";
import { OrgChartView } from "@/components/org-chart/OrgChartView";

export default function OrgChartPage(): React.ReactElement {
  const { data, isLoading, isError, error } = useOrgChart();

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
          <OrgChartView data={data} />
        )}
      </div>
    </div>
  );
}
