import { useCallback } from "react";
import { useTracking } from "@/providers/tracking-provider";
import type { UxEventType } from "@/lib/ux-tracker";

/**
 * Hook for imperative event tracking from components.
 *
 * Usage:
 *   const trackEvent = useTrackEvent();
 *   trackEvent('click', { target: '#save-btn', meta: { context: 'deal-form' } });
 */
export function useTrackEvent() {
  const { track } = useTracking();

  return useCallback(
    (
      type: UxEventType,
      opts?: { target?: string; targetText?: string; meta?: Record<string, unknown> },
    ) => {
      track({
        type,
        timestamp: Date.now(),
        page: globalThis.location.pathname,
        target: opts?.target,
        targetText: opts?.targetText,
        meta: opts?.meta,
      });
    },
    [track],
  );
}
