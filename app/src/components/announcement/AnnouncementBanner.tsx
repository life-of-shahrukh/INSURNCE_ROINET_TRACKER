"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveAnnouncements, type AnnouncementSeverity } from "@/lib/api/announcement-api";

const SEVERITY_STYLES: Record<
  AnnouncementSeverity,
  { bg: string; border: string; icon: string; textColor: string }
> = {
  info: {
    bg: "#e8f4fd",
    border: "#3282b8",
    icon: "ℹ",
    textColor: "#0f4c75",
  },
  warning: {
    bg: "#fff7ed",
    border: "#f4a261",
    icon: "⚠",
    textColor: "#92400e",
  },
  success: {
    bg: "#ecfdf5",
    border: "#2a9d8f",
    icon: "✓",
    textColor: "#065f46",
  },
  error: {
    bg: "#fff0f0",
    border: "#e63946",
    icon: "✕",
    textColor: "#991b1b",
  },
};

const AUTO_ROTATE_MS = 5000;

export function AnnouncementBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const autoRotateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements", "active"],
    queryFn: fetchActiveAnnouncements,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const count = announcements.length;

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % Math.max(count, 1));
  }, [count]);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + Math.max(count, 1)) % Math.max(count, 1));
  }, [count]);

  // Reset index when announcements change and current index is out of range
  useEffect(() => {
    if (count > 0 && activeIndex >= count) {
      setActiveIndex(0);
    }
    if (count > 0) {
      setVisible(true);
    }
  }, [count, activeIndex]);

  // Auto-rotate carousel
  useEffect(() => {
    if (count <= 1) return;
    autoRotateRef.current = setInterval(next, AUTO_ROTATE_MS);
    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [count, next]);

  const resetAutoRotate = useCallback(() => {
    if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    if (count > 1) {
      autoRotateRef.current = setInterval(next, AUTO_ROTATE_MS);
    }
  }, [count, next]);

  if (!visible || count === 0) return null;

  const current = announcements[Math.min(activeIndex, count - 1)];
  if (!current) return null;

  const style = SEVERITY_STYLES[current.severity as AnnouncementSeverity] ?? SEVERITY_STYLES.info;

  function handlePrev() {
    prev();
    resetAutoRotate();
  }

  function handleNext() {
    next();
    resetAutoRotate();
  }

  return (
    <div className="announcement-carousel">
      <div
        className={`announcement-banner announcement-banner--${current.severity}`}
        style={{
          background: style.bg,
          borderLeft: `4px solid ${style.border}`,
          color: style.textColor,
        }}
        role="alert"
        aria-live="polite"
      >
        <span className="announcement-banner__icon" aria-hidden="true">
          {style.icon}
        </span>

        <div className="announcement-banner__body">
          <strong className="announcement-banner__title">{current.title}</strong>
          <span className="announcement-banner__content">{current.content}</span>
        </div>

        <div className="announcement-banner__controls">
          {count > 1 && (
            <>
              <button
                type="button"
                className="announcement-nav-btn"
                onClick={handlePrev}
                aria-label="Previous announcement"
                style={{ color: style.textColor }}
              >
                ‹
              </button>
              <div className="announcement-counter" aria-label={`${activeIndex + 1} of ${count}`}>
                {activeIndex + 1}/{count}
              </div>
              <button
                type="button"
                className="announcement-nav-btn"
                onClick={handleNext}
                aria-label="Next announcement"
                style={{ color: style.textColor }}
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
