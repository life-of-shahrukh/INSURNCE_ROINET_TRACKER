"use client";

import { PrimeReactProvider } from "primereact/api";
import type { ReactNode } from "react";

export function PrimeProvider({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <PrimeReactProvider
      value={{
        ripple: false,
      }}
    >
      {children}
    </PrimeReactProvider>
  );
}
