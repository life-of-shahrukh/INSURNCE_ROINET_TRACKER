"use client";

import { useEffect, useRef, useState } from "react";
import type { ColumnManagerResult } from "@/hooks/useColumnManager";

interface ColumnManagerPanelProps {
  manager: ColumnManagerResult;
}

export function ColumnManagerPanel({
  manager,
}: ColumnManagerPanelProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const dragKey = useRef<string | null>(null);
  const dragOverKey = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { allColumns, toggleColumn, moveColumn, isVisible } = manager;

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const visibleCount = allColumns.filter((c) => isVisible(c.key)).length;
  const totalCount = allColumns.filter((c) => !c.alwaysVisible).length;

  return (
    <div className="col-mgr-wrap" ref={panelRef}>
      <button
        type="button"
        className={`col-mgr-btn${open ? " col-mgr-btn--active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Manage columns"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <rect x="1" y="2" width="4" height="12" rx="1" fill="currentColor" />
          <rect x="6" y="2" width="4" height="12" rx="1" fill="currentColor" opacity="0.6" />
          <rect x="11" y="2" width="4" height="12" rx="1" fill="currentColor" opacity="0.35" />
        </svg>
        Columns
        {visibleCount < totalCount + allColumns.filter((c) => c.alwaysVisible).length ? (
          <span className="col-mgr-badge">{visibleCount}</span>
        ) : null}
        <svg
          className={`col-mgr-chevron${open ? " col-mgr-chevron--up" : ""}`}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="col-mgr-panel" role="dialog" aria-label="Manage columns">
          <div className="col-mgr-panel-header">
            <span className="col-mgr-panel-title">Manage Columns</span>
            <span className="col-mgr-panel-hint">Drag ⠿ to reorder</span>
          </div>

          <ul className="col-mgr-list">
            {allColumns.map((col) => {
              const visible = isVisible(col.key);
              const locked = !!col.alwaysVisible;

              return (
                <li
                  key={col.key}
                  className="col-mgr-item"
                  draggable={!locked}
                  onDragStart={() => {
                    dragKey.current = col.key;
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    dragOverKey.current = col.key;
                    if (dragKey.current && dragKey.current !== col.key) {
                      moveColumn(dragKey.current, col.key);
                    }
                  }}
                  onDragEnd={() => {
                    dragKey.current = null;
                    dragOverKey.current = null;
                  }}
                >
                  <span
                    className="col-mgr-drag-handle"
                    aria-hidden="true"
                    title={locked ? "Cannot reorder" : "Drag to reorder"}
                  >
                    {locked ? "" : "⠿"}
                  </span>

                  <label className="col-mgr-label">
                    <input
                      type="checkbox"
                      className="col-mgr-checkbox"
                      checked={visible}
                      disabled={locked}
                      onChange={() => toggleColumn(col.key)}
                    />
                    <span className={locked ? "col-mgr-label-text col-mgr-label-text--locked" : "col-mgr-label-text"}>
                      {col.label || "(Actions)"}
                    </span>
                  </label>

                  {locked && (
                    <span className="col-mgr-lock" title="Always visible" aria-hidden="true">
                      🔒
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="col-mgr-panel-footer">
            <button
              type="button"
              className="col-mgr-reset"
              onClick={() => {
                allColumns
                  .filter((c) => !c.alwaysVisible && !isVisible(c.key))
                  .forEach((c) => toggleColumn(c.key));
              }}
            >
              Show all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
