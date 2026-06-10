"use client";

import { useCallback, useMemo, useState } from "react";

export interface ColumnConfig {
  key: string;
  label: string;
  /** Hide by default. All columns are visible unless this is false. */
  defaultVisible?: boolean;
  /** Cannot be hidden or reordered away (e.g. actions column). */
  alwaysVisible?: boolean;
}

interface StoredState {
  order: string[];
  hidden: string[];
}

function loadState(tableId: string, columns: ColumnConfig[]): StoredState {
  const allKeys = columns.map((c) => c.key);
  const defaultHidden = columns
    .filter((c) => c.defaultVisible === false && !c.alwaysVisible)
    .map((c) => c.key);

  if (typeof window === "undefined") {
    return { order: allKeys, hidden: defaultHidden };
  }

  try {
    const raw = localStorage.getItem(`col-mgr:${tableId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      // Keep stored order; append newly-added columns at the end; drop removed ones.
      const storedOrder = (parsed.order ?? []).filter((k) => allKeys.includes(k));
      const newKeys = allKeys.filter((k) => !storedOrder.includes(k));
      return {
        order: [...storedOrder, ...newKeys],
        hidden: (parsed.hidden ?? []).filter((k) => allKeys.includes(k)),
      };
    }
  } catch {
    // ignore corrupt storage
  }

  return { order: allKeys, hidden: defaultHidden };
}

function saveState(tableId: string, state: StoredState): void {
  try {
    localStorage.setItem(`col-mgr:${tableId}`, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export interface ColumnManagerResult {
  /** All columns in user-defined order (for the panel list). */
  allColumns: ColumnConfig[];
  /** Only the visible columns in order (for rendering table headers/cells). */
  visibleColumns: ColumnConfig[];
  /** Toggle a column's visibility by key. */
  toggleColumn: (key: string) => void;
  /** Reorder: move column identified by fromKey to the position of toKey. */
  moveColumn: (fromKey: string, toKey: string) => void;
  /** Whether a column is currently visible. */
  isVisible: (key: string) => boolean;
}

export function useColumnManager(
  tableId: string,
  columns: ColumnConfig[],
): ColumnManagerResult {
  const [state, setState] = useState<StoredState>(() =>
    loadState(tableId, columns),
  );

  const colMap = useMemo(
    () => new Map(columns.map((c) => [c.key, c])),
    [columns],
  );

  const hiddenSet = useMemo(() => new Set(state.hidden), [state.hidden]);

  const allColumns = useMemo(
    () => state.order.map((k) => colMap.get(k)).filter((c): c is ColumnConfig => c !== undefined),
    [state.order, colMap],
  );

  const visibleColumns = useMemo(
    () => allColumns.filter((c) => c.alwaysVisible || !hiddenSet.has(c.key)),
    [allColumns, hiddenSet],
  );

  const toggleColumn = useCallback(
    (key: string) => {
      const col = colMap.get(key);
      if (!col || col.alwaysVisible) return;
      setState((prev) => {
        const hidden = prev.hidden.includes(key)
          ? prev.hidden.filter((k) => k !== key)
          : [...prev.hidden, key];
        const next = { ...prev, hidden };
        saveState(tableId, next);
        return next;
      });
    },
    [colMap, tableId],
  );

  const moveColumn = useCallback(
    (fromKey: string, toKey: string) => {
      if (fromKey === toKey) return;
      setState((prev) => {
        const order = [...prev.order];
        const fromIdx = order.indexOf(fromKey);
        const toIdx = order.indexOf(toKey);
        if (fromIdx === -1 || toIdx === -1) return prev;
        order.splice(fromIdx, 1);
        order.splice(toIdx, 0, fromKey);
        const next = { ...prev, order };
        saveState(tableId, next);
        return next;
      });
    },
    [tableId],
  );

  const isVisible = useCallback(
    (key: string) => {
      const col = colMap.get(key);
      if (col?.alwaysVisible) return true;
      return !hiddenSet.has(key);
    },
    [hiddenSet, colMap],
  );

  return { allColumns, visibleColumns, toggleColumn, moveColumn, isVisible };
}
