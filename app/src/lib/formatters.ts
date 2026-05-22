import type { DealStatus } from "./types";

export function fmtINR(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "–";
  return "₹" + Number(n).toLocaleString("en-IN");
}

export function fmtINRShort(n: number | null | undefined): string {
  if (!n) return "₹0";
  const abs = Math.abs(n);
  if (abs >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
  if (abs >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
  if (abs >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n;
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function statusLabel(s: DealStatus): string {
  return { H: "Hot", W: "Warm", C: "Cold" }[s] ?? "–";
}

export function statusBadgeClass(s: DealStatus): string {
  return { H: "badge-hot", W: "badge-warm", C: "badge-cold" }[s] ?? "badge-muted";
}

export function uid(): string {
  return "id_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}
