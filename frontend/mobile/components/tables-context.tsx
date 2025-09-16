import { createContext, ReactNode, useContext, useMemo, useState, useCallback } from 'react';

type TablesContextValue = {
  occupiedTableIds: Set<string>;
  pendingTableIds: Set<string>;
  occupyTable: (tableId: string) => void;
  freeTable: (tableId: string) => void;
  markPending: (tableId: string) => void;
  clearPending: (tableId: string) => void;
  isOccupied: (tableId: string) => boolean;
  isPending: (tableId: string) => boolean;
};

const TablesContext = createContext<TablesContextValue | undefined>(undefined);

export function TablesProvider({ children }: { children: ReactNode }) {
  const [occupiedTableIds, setOccupiedTableIds] = useState<Set<string>>(new Set());
  const [pendingTableIds, setPendingTableIds] = useState<Set<string>>(new Set());

  const occupyTable = useCallback((tableId: string) =>
    setOccupiedTableIds((prev) => new Set(prev).add(tableId)), []);

  const freeTable = useCallback((tableId: string) => {
    setOccupiedTableIds((prev) => {
      const next = new Set(prev);
      next.delete(tableId);
      return next;
    });
    setPendingTableIds((prev) => {
      const next = new Set(prev);
      next.delete(tableId);
      return next;
    });
  }, []);

  const markPending = useCallback((tableId: string) => setPendingTableIds((prev) => new Set(prev).add(tableId)), []);
  const clearPending = useCallback((tableId: string) =>
    setPendingTableIds((prev) => {
      const next = new Set(prev);
      next.delete(tableId);
      return next;
    }), []);

  const value = useMemo<TablesContextValue>(
    () => ({
      occupiedTableIds,
      pendingTableIds,
      occupyTable,
      freeTable,
      markPending,
      clearPending,
      isOccupied: (id: string) => occupiedTableIds.has(id),
      isPending: (id: string) => pendingTableIds.has(id),
    }),
    [occupiedTableIds, pendingTableIds, occupyTable, freeTable, markPending, clearPending]
  );

  return <TablesContext.Provider value={value}>{children}</TablesContext.Provider>;
}

export function useTables() {
  const ctx = useContext(TablesContext);
  if (!ctx) throw new Error('useTables must be used within TablesProvider');
  return ctx;
}


