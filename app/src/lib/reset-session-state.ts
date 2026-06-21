import { clearBrowserQueryCache } from '@/providers/react-query-provider';
import { clearAnnouncementBannerDismissals } from '@/lib/announcement-dismiss-storage';
import { useUIStore } from '@/store/ui-store';

/** Wipe client caches that are tied to the previous signed-in user. */
export function resetSessionClientState(): void {
  clearBrowserQueryCache();
  clearAnnouncementBannerDismissals();
  const ui = useUIStore.getState();
  ui.resetFilters();
  ui.clearDealSelection();
  ui.resetLocationSelection();
  ui.closeModal();
}
