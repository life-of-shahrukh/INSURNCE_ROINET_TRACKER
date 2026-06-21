"use client";

import type { ReactNode } from "react";

interface LoadingGateProps {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}

export function LoadingGate({
  loading,
  skeleton,
  children,
}: LoadingGateProps): React.ReactElement {
  if (loading) return <>{skeleton}</>;
  return <>{children}</>;
}
