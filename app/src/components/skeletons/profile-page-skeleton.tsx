"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonBlock, SkeletonCircle, SkeletonLine } from "./skeleton-primitives";

export function ProfilePageSkeleton(): React.ReactElement {
  return (
    <div style={{ padding: "2rem" }}>
      <PageHeader title="My Profile" subtitle="Loading profile…" />
      <div style={{ display: "grid", gap: "1.5rem", maxWidth: "900px" }}>
        <div className="skeleton-profile-hero">
          <SkeletonCircle size="3.75rem" />
          <div className="skeleton-profile-hero-text">
            <SkeletonLine width="55%" height="1.25rem" />
            <SkeletonLine width="40%" height="0.875rem" />
            <SkeletonLine width="65%" height="0.75rem" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card skeleton-profile-card">
            <SkeletonLine width="35%" height="1rem" />
            <div className="skeleton-profile-card-body">
              <SkeletonLine width="100%" height="0.875rem" />
              <SkeletonLine width="85%" height="0.875rem" />
              <SkeletonLine width="70%" height="0.875rem" />
              <SkeletonBlock height="3rem" borderRadius="6px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
