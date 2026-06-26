"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useCreateCustomer } from "@/hooks/useCustomers";
import { otpApi } from "@/lib/api/otp-api";
import type { Customer } from "@/lib/api/customer-api";
import { INSURANCE_PRODUCTS } from "@/lib/filters/insurance-products";

interface QuickAddCustomerModalProps {
  open: boolean;
  /** Name pre-filled from what the user already typed in the search box. */
  prefillName: string;
  onClose: () => void;
  /**
   * Called after the customer is successfully created.
   * `policyType` is the Insurance Interest the user selected — the caller
   * should use it to pre-fill the deal's Policy Type field.
   */
  onCreated: (customer: Customer, policyType: string) => void;
}

type Step = "form" | "otp";

type OtpPhase =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "awaiting"; requestId: string; countdown: number }
  | { phase: "verifying" };

function maskMobile(m: string): string {
  if (m.length < 6) return m;
  return m.slice(0, 2) + "****" + m.slice(-4);
}

export function QuickAddCustomerModal({
  open,
  prefillName,
  onClose,
  onCreated,
}: QuickAddCustomerModalProps): React.ReactElement | null {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState(prefillName);
  const [mobile, setMobile] = useState("");
  const [policyType, setPolicyType] = useState<string>(INSURANCE_PRODUCTS[0].value);
  const [mobileError, setMobileError] = useState("");

  const [otpPhase, setOtpPhase] = useState<OtpPhase>({ phase: "idle" });
  const [otpCode, setOtpCode] = useState("");

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { mutateAsync: createCustomer, isPending: isCreating } = useCreateCustomer();

  // Reset form every time the modal opens
  useEffect(() => {
    if (open) {
      setStep("form");
      setName(prefillName);
      setMobile("");
      setPolicyType(INSURANCE_PRODUCTS[0].value);
      setMobileError("");
      setOtpPhase({ phase: "idle" });
      setOtpCode("");
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [open, prefillName]);

  const startCountdown = (requestId: string): void => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setOtpPhase({ phase: "awaiting", requestId, countdown: 60 });
    countdownRef.current = setInterval(() => {
      setOtpPhase((prev) => {
        if (prev.phase !== "awaiting") {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return prev;
        }
        if (prev.countdown <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return { phase: "awaiting", requestId: prev.requestId, countdown: 0 };
        }
        return { ...prev, countdown: prev.countdown - 1 };
      });
    }, 1000);
  };

  // Step 1: validate form → move to OTP step and auto-send OTP
  const handleFormSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!name.trim()) return;
    if (mobile.length !== 10) {
      setMobileError("Mobile must be 10 digits");
      return;
    }
    setMobileError("");
    setStep("otp");
    setOtpPhase({ phase: "sending" });
    try {
      const { requestId } = await otpApi.send(mobile);
      startCountdown(requestId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(msg);
      setOtpPhase({ phase: "idle" });
    }
  };

  const handleResendOtp = async (): Promise<void> => {
    setOtpPhase({ phase: "sending" });
    setOtpCode("");
    try {
      const { requestId } = await otpApi.send(mobile);
      startCountdown(requestId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to resend OTP";
      toast.error(msg);
      setOtpPhase({ phase: "idle" });
    }
  };

  // Step 2: verify OTP → create customer
  const handleVerifyAndCreate = async (): Promise<void> => {
    if (otpPhase.phase !== "awaiting") return;
    const { requestId } = otpPhase;
    setOtpPhase({ phase: "verifying" });
    try {
      // Create the customer first so we have the customerId for the OTP verify call
      const customer = await createCustomer({ name: name.trim(), mobile: mobile.trim() });
      // Mark mobile as verified on the newly created customer
      await otpApi.verify(requestId, otpCode, customer.id);
      if (countdownRef.current) clearInterval(countdownRef.current);
      toast.success(`Customer "${customer.name}" added and verified`);
      onCreated(customer, policyType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again";
      toast.error(`Failed: ${msg}`);
      setOtpPhase({ phase: "awaiting", requestId, countdown: 0 });
    }
  };

  if (!open) return null;

  const isAwaiting = otpPhase.phase === "awaiting";
  const isSending = otpPhase.phase === "sending";
  const isVerifying = otpPhase.phase === "verifying";
  const canResend = isAwaiting && otpPhase.countdown === 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qa-modal-title"
        style={{
          background: "var(--color-surface, #fff)",
          borderRadius: 12,
          width: "min(460px, 95vw)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "20px 24px 14px",
            borderBottom: "1px solid var(--color-border, #e5e7eb)",
          }}
        >
          <div>
            <div id="qa-modal-title" style={{ fontWeight: 700, fontSize: 15 }}>
              {step === "form" ? "Add New Customer" : "Verify Mobile Number"}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
              {step === "form"
                ? "Customer will be auto-selected in the deal form"
                : `Enter the OTP sent to ${maskMobile(mobile)}`}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating || isVerifying || isSending}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              color: "#aaa",
              lineHeight: 1,
              padding: "0 2px",
            }}
          >
            ×
          </button>
        </div>

        {/* ── Step 1: Customer details form ── */}
        {step === "form" && (
          <form onSubmit={handleFormSubmit} style={{ padding: "20px 24px 24px" }}>
            <div className="form-group">
              <label htmlFor="qa-name">
                Full Name <span style={{ color: "var(--color-error, #e53e3e)" }}>*</span>
              </label>
              <input
                id="qa-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer full name"
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label htmlFor="qa-mobile">
                Mobile Number <span style={{ color: "var(--color-error, #e53e3e)" }}>*</span>
              </label>
              <input
                id="qa-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setMobile(digits);
                  setMobileError(digits.length > 0 && digits.length < 10 ? "Mobile must be 10 digits" : "");
                }}
                placeholder="10-digit mobile number"
                required
                maxLength={10}
                inputMode="numeric"
              />
              {mobileError && <span className="field-error">{mobileError}</span>}
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label htmlFor="qa-policy-type">Insurance Interest</label>
              <select
                id="qa-policy-type"
                value={policyType}
                onChange={(e) => setPolicyType(e.target.value)}
              >
                {INSURANCE_PRODUCTS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "#999" }}>
                Auto-fills the Policy Type field in the deal
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 22 }}>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Next — Verify Mobile</Button>
            </div>
          </form>
        )}

        {/* ── Step 2: OTP verification ── */}
        {step === "otp" && (
          <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                padding: "14px 16px",
                background: "#fffbeb",
                border: "1px solid #fcd34d",
                borderRadius: 8,
                fontSize: 13,
                color: "#78350f",
              }}
            >
              An OTP has been sent to <strong>{maskMobile(mobile)}</strong>.
              It is valid for <strong>15 minutes</strong>.
            </div>

            {isSending && (
              <p style={{ fontSize: 13, color: "#888", textAlign: "center" }}>Sending OTP…</p>
            )}

            {(isAwaiting || isVerifying) && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  style={{ flex: 1, minWidth: 140, letterSpacing: 4, fontWeight: 700 }}
                  disabled={isVerifying}
                  autoFocus
                />
                {isAwaiting && otpPhase.countdown > 0 && (
                  <span style={{ fontSize: 12, color: "#92400e", whiteSpace: "nowrap" }}>
                    Resend in {otpPhase.countdown}s
                  </span>
                )}
              </div>
            )}

            {canResend && (
              <Button type="button" variant="secondary" onClick={handleResendOtp} style={{ alignSelf: "flex-start" }}>
                Resend OTP
              </Button>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setStep("form"); setOtpPhase({ phase: "idle" }); setOtpCode(""); }}
                disabled={isVerifying || isCreating}
              >
                ← Back
              </Button>
              <Button
                type="button"
                onClick={handleVerifyAndCreate}
                disabled={isVerifying || isCreating || otpCode.length !== 6 || !isAwaiting}
              >
                {isVerifying || isCreating ? "Verifying…" : "Verify & Add Customer"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
