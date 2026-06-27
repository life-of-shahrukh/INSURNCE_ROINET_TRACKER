"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { UxTracker, type UxEvent, type UxIdentity } from "@/lib/ux-tracker";
import { useAuth } from "@/providers/auth-provider";

interface TrackingContextValue {
  track: (event: UxEvent) => void;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);

export function TrackingProvider({ children }: Readonly<{ children: ReactNode }>) {
  const trackerRef = useRef<UxTracker | null>(null);
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof globalThis.window === "undefined") return;

    const tracker = new UxTracker();
    trackerRef.current = tracker;
    tracker.start();

    return () => {
      tracker.stop();
      trackerRef.current = null;
    };
  }, []);

  // Identify user whenever auth state changes
  useEffect(() => {
    if (!trackerRef.current || !user) return;
    const identity: UxIdentity = {
      userId: user.id,
      role: user.role,
      pospId: user.pospId,
    };
    trackerRef.current.identify(identity);
  }, [user]);

  // Track route changes
  useEffect(() => {
    if (!trackerRef.current || !pathname) return;
    trackerRef.current.trackPageView(pathname);
  }, [pathname]);

  const track = useCallback((event: UxEvent): void => {
    trackerRef.current?.push(event);
  }, []);

  const value = useMemo(() => ({ track }), [track]);

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextValue {
  const ctx = useContext(TrackingContext);
  if (!ctx) {
    throw new Error("useTracking must be used within <TrackingProvider>");
  }
  return ctx;
}
