import { clearBrowserQueryCache } from '@/providers/react-query-provider';
import { useUIStore } from '@/store/ui-store';

/** Wipe client caches that are tied to the previous signed-in user. */
export function resetSessionClientState(): void {
  clearBrowserQueryCache();
  const ui = useUIStore.getState();
  ui.resetFilters();
  ui.clearDealSelection();
  ui.resetLocationSelection();
  ui.closeModal();
}
