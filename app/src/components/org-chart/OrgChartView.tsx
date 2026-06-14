"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { OrgNode } from "@/hooks/useSalesTeam";

// d3-org-chart ships its own type declarations
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { OrgChart } = require("d3-org-chart") as { OrgChart: new () => D3OrgChart };

interface D3OrgChart {
  container(el: HTMLDivElement): this;
  data(nodes: OrgNode[]): this;
  nodeWidth(_: () => number): this;
  nodeHeight(_: () => number): this;
  nodeContent(fn: (d: { data: OrgNode }) => string): this;
  render(): this;
  fit(): void;
  zoomIn(): void;
  zoomOut(): void;
  expandAll(): this;
  collapseAll(): this;
  setCentered(id: string): this;
  clearHighlighting(): this;
  setUpToTheRootHighlighted(id: string): this;
}

const DESIGNATION_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  R5: { bg: "#0f4c75", color: "#ffffff", label: "National Head" },
  R4: { bg: "#1b6ca8", color: "#ffffff", label: "Zonal Head" },
  R3: { bg: "#3282b8", color: "#ffffff", label: "Regional Head" },
  R2: { bg: "#1b8a99", color: "#ffffff", label: "ASM" },
  R1: { bg: "#2a9d8f", color: "#ffffff", label: "DM Cluster" },
  DM: { bg: "#264653", color: "#ffffff", label: "Dist. Manager" },
};

function getConfig(designation: string) {
  return DESIGNATION_CONFIG[designation] ?? { bg: "#666", color: "#fff", label: designation };
}

function buildNodeHtml(d: { data: OrgNode }): string {
  const node = d.data;
  const cfg = getConfig(node.designation);
  const district = node.districtName
    ? `<div style="font-size:10px;color:#999;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${node.districtName}</div>`
    : "";
  return `
    <div style="
      width:200px;
      background:#fff;
      border-radius:8px;
      box-shadow:0 2px 8px rgba(0,0,0,0.12);
      overflow:hidden;
      font-family:inherit;
      border:1px solid #e5e7eb;
    ">
      <div style="
        background:${cfg.bg};
        color:${cfg.color};
        padding:6px 12px;
        font-size:11px;
        font-weight:600;
        letter-spacing:0.5px;
        text-transform:uppercase;
      ">${cfg.label}</div>
      <div style="padding:10px 12px;">
        <div style="
          font-size:13px;
          font-weight:600;
          color:#111827;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        ">${node.name}</div>
        <div style="
          font-size:11px;
          color:#6b7280;
          margin-top:2px;
        ">${node.employeeCode}</div>
        ${district}
      </div>
    </div>
  `;
}

interface OrgChartViewProps {
  data: OrgNode[];
  /** The OrgNode.id matching the currently logged-in user. When supplied the
   *  chart expands all nodes, highlights the path to root, and centres on this
   *  node automatically on first render. */
  currentUserNodeId?: string;
}

const toolbarButtonStyle: React.CSSProperties = {
  padding: "5px 12px",
  fontSize: "12px",
  fontWeight: 600,
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  cursor: "pointer",
  color: "#374151",
};

export function OrgChartView({ data, currentUserNodeId }: OrgChartViewProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<D3OrgChart | null>(null);
  const [search, setSearch] = useState("");

  const initChart = useCallback(() => {
    if (!containerRef.current || !data.length) return;

    if (!chartRef.current) {
      chartRef.current = new OrgChart();
    }

    chartRef.current
      .container(containerRef.current)
      .data(data)
      .nodeWidth(() => 210)
      .nodeHeight(() => 90)
      .nodeContent(buildNodeHtml)
      .render();

    // Expand the full tree, then focus on the current user's node.
    if (currentUserNodeId) {
      chartRef.current
        .expandAll()
        .setUpToTheRootHighlighted(currentUserNodeId)
        .setCentered(currentUserNodeId)
        .render();
    } else {
      // No specific user node — expand all so the full hierarchy is visible.
      chartRef.current.expandAll().render();
    }
  }, [data, currentUserNodeId]);

  useEffect(() => {
    initChart();
  }, [initChart]);

  // Search: highlight matching node and its path to root
  useEffect(() => {
    if (!chartRef.current) return;
    if (!search.trim()) {
      chartRef.current.clearHighlighting();
      return;
    }
    const lower = search.toLowerCase();
    const match = data.find(
      (n) =>
        n.name.toLowerCase().includes(lower) ||
        n.employeeCode.toLowerCase().includes(lower) ||
        (n.districtName ?? "").toLowerCase().includes(lower)
    );
    if (match) {
      chartRef.current
        .clearHighlighting()
        .setUpToTheRootHighlighted(match.id)
        .setCentered(match.id)
        .render();
    }
  }, [search, data]);

  const handleFit = useCallback(() => {
    chartRef.current?.fit();
  }, []);
  const handleZoomIn = useCallback(() => {
    chartRef.current?.zoomIn();
  }, []);
  const handleZoomOut = useCallback(() => {
    chartRef.current?.zoomOut();
  }, []);
  const handleExpandAll = useCallback(() => {
    chartRef.current?.expandAll().render();
  }, []);
  const handleCollapseAll = useCallback(() => {
    chartRef.current?.collapseAll().render();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          background: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search by name, code or district…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 220px",
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontSize: "13px",
            outline: "none",
            minWidth: 0,
          }}
        />
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button type="button" onClick={handleFit} style={toolbarButtonStyle}>
            Fit
          </button>
          <button type="button" onClick={handleZoomIn} style={toolbarButtonStyle}>
            ＋
          </button>
          <button type="button" onClick={handleZoomOut} style={toolbarButtonStyle}>
            －
          </button>
          <button type="button" onClick={handleExpandAll} style={toolbarButtonStyle}>
            Expand All
          </button>
          <button type="button" onClick={handleCollapseAll} style={toolbarButtonStyle}>
            Collapse All
          </button>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "8px 16px",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {Object.entries(DESIGNATION_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "2px",
                background: cfg.bg,
              }}
            />
            <span style={{ fontSize: "11px", color: "#6b7280" }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Chart canvas */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: "hidden", minHeight: 0 }}
      />
    </div>
  );
}
