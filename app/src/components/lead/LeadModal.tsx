"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCreateLead, useUpdateLead } from "@/hooks/useLeads";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CustomerSearchSelect } from "@/components/customer/CustomerSearchSelect";
import { leadFormSchema, type LeadFormValues } from "@/lib/schemas";
import { otpApi } from "@/lib/api/otp-api";
import type { Customer } from "@/lib/api/customer-api";
import type {
  Lead,
  CreateLeadInput,
  ClosureTimeline,
  LeadProduct,
  LeadStatus,
} from "@/lib/api/lead-api";

interface LeadModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
}

type OtpState =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "awaiting"; requestId: string; countdown: number }
  | { phase: "verifying" }
  | { phase: "verified" };

const empty: CreateLeadInput & { status: LeadStatus } = {
  customerId: "",
  product: "LIFE",
  estimatedPremium: 0,
  estimatedSum: 0,
  closureTimeline: "THIS_MONTH",
  expectedCloseDate: "",
  source: "",
  remarks: "",
  status: "NEW",
};

function maskMobile(mobile: string): string {
  if (mobile.length < 6) return mobile;
  return mobile.slice(0, 2) + "****" + mobile.slice(-4);
}

export function LeadModal({ open, lead, onClose }: LeadModalProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] =
    useState<Partial<Record<keyof LeadFormValues, string>>>({});

  // Customer resolved from the search dropdown (needed for OTP flow)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [otpState, setOtpState] = useState<OtpState>({ phase: "idle" });
  const [otpCode, setOtpCode] = useState("");

  // Countdown timer ref
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Tracks the last lead ID that was loaded into the form.
   * undefined  = modal never opened yet
   * null       = last open was in "new lead" mode
   * string     = last open was editing that lead ID
   */
  const prevLeadIdRef = useRef<string | null | undefined>(undefined);

  // Reset OTP state when modal closes or customer changes
  useEffect(() => {
    if (!open) {
      setErrors({});
      setOtpState({ phase: "idle" });
      setOtpCode("");
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    setErrors({});

    if (lead) {
      setForm({
        customerId: lead.customerId,
        product: lead.product,
        estimatedPremium: lead.estimatedPremium,
        estimatedSum: lead.estimatedSum || 0,
        closureTimeline: lead.closureTimeline,
        expectedCloseDate: lead.expectedCloseDate?.slice(0, 10) || "",
        source: lead.source || "",
        remarks: lead.remarks || "",
        status: lead.status,
      });
      prevLeadIdRef.current = lead.id;
    } else if (
      prevLeadIdRef.current !== null &&
      prevLeadIdRef.current !== undefined
    ) {
      setForm(empty);
      setSelectedCustomer(null);
      setOtpState({ phase: "idle" });
      prevLeadIdRef.current = null;
    } else {
      prevLeadIdRef.current = null;
    }
  }, [open, lead]);

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = (requestId: string): void => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setOtpState({ phase: "awaiting", requestId, countdown: 60 });
    countdownRef.current = setInterval(() => {
      setOtpState((prev) => {
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

  const handleSendOtp = async (): Promise<void> => {
    if (!selectedCustomer) return;
    setOtpState({ phase: "sending" });
    try {
      const { requestId } = await otpApi.send(selectedCustomer.mobile);
      startCountdown(requestId);
      setOtpCode("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(msg);
      setOtpState({ phase: "idle" });
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    if (otpState.phase !== "awaiting" || !selectedCustomer) return;
    const { requestId } = otpState;
    setOtpState({ phase: "verifying" });
    try {
      await otpApi.verify(requestId, otpCode, selectedCustomer.id);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setOtpState({ phase: "verified" });
      toast.success("Mobile number verified successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OTP verification failed";
      toast.error(msg);
      setOtpState({ phase: "awaiting", requestId, countdown: 0 });
    }
  };

  const handleCustomerChange = (
    customerId: string | null,
    _customerName: string | null,
    customer?: Customer | null,
  ): void => {
    setForm({ ...form, customerId: customerId || "" });

    if (!customerId || !customer) {
      setSelectedCustomer(null);
      setOtpState({ phase: "idle" });
      setOtpCode("");
      return;
    }

    setSelectedCustomer(customer);

    // If this customer is already verified, skip the OTP step entirely
    if (customer.mobileVerified) {
      setOtpState({ phase: "verified" });
    } else {
      setOtpState({ phase: "idle" });
      setOtpCode("");
    }
  };

  // Determine whether the form submit should be blocked
  const otpRequired =
    !lead &&
    selectedCustomer !== null &&
    !selectedCustomer.mobileVerified &&
    otpState.phase !== "verified";

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (otpRequired) {
      toast.error("Please verify the customer's mobile number before saving");
      return;
    }
    const result = leadFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LeadFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LeadFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      if (lead) {
        await updateLead.mutateAsync({ id: lead.id, data: form });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { status, ...createPayload } = form;
        await createLead.mutateAsync(createPayload);
      }
      toast.success(lead ? "Lead updated successfully" : "Lead created successfully");
      setForm(empty);
      setSelectedCustomer(null);
      setOtpState({ phase: "idle" });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      toast.error(`Failed to save lead: ${msg}`);
    }
  };

  const showOtpPanel =
    !lead && selectedCustomer !== null && !selectedCustomer.mobileVerified;

  return (
    <Modal
      open={open}
      title={lead ? "Edit Lead" : "New Lead"}
      onClose={onClose}
      footer={
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="lead-form"
            disabled={createLead.isPending || updateLead.isPending || otpRequired}
          >
            {createLead.isPending || updateLead.isPending
              ? "Saving…"
              : "Save Lead"}
          </Button>
        </div>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group full">
            <CustomerSearchSelectWithData
              value={form.customerId || null}
              onChange={handleCustomerChange}
              label="Customer"
              required
            />
            {errors.customerId && (
              <span className="field-error">{errors.customerId}</span>
            )}
          </div>

          {/* ── OTP Verification Panel ─────────────────────────────────────── */}
          {showOtpPanel && (
            <div className="form-group full">
              <OtpVerificationPanel
                customer={selectedCustomer}
                otpState={otpState}
                otpCode={otpCode}
                onOtpCodeChange={setOtpCode}
                onSendOtp={handleSendOtp}
                onVerifyOtp={handleVerifyOtp}
              />
            </div>
          )}

          {otpState.phase === "verified" && selectedCustomer && !selectedCustomer.mobileVerified && (
            <div className="form-group full">
              <div style={{
                padding: "8px 12px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 6,
                color: "#166534",
                fontSize: 13,
                fontWeight: 600,
              }}>
                ✓ Mobile number verified — you can now save this lead
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="l-product">Product *</label>
            <select
              id="l-product"
              required
              value={form.product}
              onChange={(e) =>
                setForm({ ...form, product: e.target.value as LeadProduct })
              }
            >
              <option value="LIFE">Life</option>
              <option value="HEALTH">Health</option>
              <option value="MOTOR">Motor</option>
            </select>
            {errors.product && (
              <span className="field-error">{errors.product}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="l-timeline">Closure Timeline *</label>
            <select
              id="l-timeline"
              required
              value={form.closureTimeline}
              onChange={(e) =>
                setForm({
                  ...form,
                  closureTimeline: e.target.value as ClosureTimeline,
                })
              }
            >
              <option value="THIS_MONTH">Hot — this month</option>
              <option value="T_PLUS_1">Warm — next month (T+1)</option>
              <option value="T_PLUS_2">Cold — within 2 months (T+2)</option>
              <option value="LATER">Later — more than 2 months</option>
            </select>
            {errors.closureTimeline && (
              <span className="field-error">{errors.closureTimeline}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="l-premium">Est. Premium (₹) *</label>
            <input
              id="l-premium"
              type="number"
              min={0}
              value={form.estimatedPremium}
              onChange={(e) =>
                setForm({ ...form, estimatedPremium: +e.target.value })
              }
            />
            {errors.estimatedPremium && (
              <span className="field-error">{errors.estimatedPremium}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="l-sum">Est. Sum Assured (₹)</label>
            <input
              id="l-sum"
              type="number"
              min={0}
              value={form.estimatedSum}
              onChange={(e) =>
                setForm({ ...form, estimatedSum: +e.target.value })
              }
            />
            {errors.estimatedSum && (
              <span className="field-error">{errors.estimatedSum}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="l-closedate">Expected Close Date</label>
            <input
              id="l-closedate"
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) =>
                setForm({ ...form, expectedCloseDate: e.target.value })
              }
            />
            {errors.expectedCloseDate && (
              <span className="field-error">{errors.expectedCloseDate}</span>
            )}
          </div>

          {lead && (
            <div className="form-group">
              <label htmlFor="l-status">Status</label>
              <select
                id="l-status"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as LeadStatus })
                }
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
              {errors.status && (
                <span className="field-error">{errors.status}</span>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="l-source">Source</label>
            <input
              id="l-source"
              type="text"
              placeholder="Referral, Campaign, Walk-in…"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </div>

          <div className="form-group full">
            <label htmlFor="l-remarks">Remarks</label>
            <textarea
              id="l-remarks"
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ─── CustomerSearchSelect wrapper that surfaces the full Customer object ────

interface CustomerSearchSelectWithDataProps {
  value: string | null;
  onChange: (id: string | null, name: string | null, customer?: Customer | null) => void;
  label?: string;
  required?: boolean;
}

function CustomerSearchSelectWithData({
  value,
  onChange,
  label,
  required,
}: CustomerSearchSelectWithDataProps) {
  // We keep a local cache of customers that have been seen so we can pass
  // the full object back to the parent when a selection is made.
  const [customerCache, setCustomerCache] = useState<Map<string, Customer>>(
    new Map(),
  );

  const handleChange = (id: string | null, name: string | null): void => {
    onChange(id, name, id ? customerCache.get(id) ?? null : null);
  };

  return (
    <CustomerSearchSelect
      value={value}
      onChange={handleChange}
      label={label}
      required={required}
      onResultsLoaded={(customers) => {
        setCustomerCache((prev) => {
          const next = new Map(prev);
          for (const c of customers) next.set(c.id, c);
          return next;
        });
      }}
    />
  );
}

// ─── OTP Verification Panel ─────────────────────────────────────────────────

interface OtpVerificationPanelProps {
  customer: Customer;
  otpState: OtpState;
  otpCode: string;
  onOtpCodeChange: (v: string) => void;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
}

function OtpVerificationPanel({
  customer,
  otpState,
  otpCode,
  onOtpCodeChange,
  onSendOtp,
  onVerifyOtp,
}: OtpVerificationPanelProps) {
  const isSending = otpState.phase === "sending";
  const isAwaiting = otpState.phase === "awaiting";
  const isVerifying = otpState.phase === "verifying";
  const canResend = isAwaiting && otpState.countdown === 0;

  return (
    <div
      style={{
        padding: "14px 16px",
        background: "#fffbeb",
        border: "1px solid #fcd34d",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>
        Verify Customer Mobile
      </div>
      <div style={{ fontSize: 13, color: "#78350f" }}>
        An OTP will be sent to{" "}
        <strong>{maskMobile(customer.mobile)}</strong>
      </div>

      {/* Send / Resend button */}
      {(otpState.phase === "idle" || canResend) && (
        <Button
          type="button"
          variant="secondary"
          onClick={onSendOtp}
          disabled={isSending}
          style={{ alignSelf: "flex-start" }}
        >
          {otpState.phase === "idle" ? "Send OTP" : "Resend OTP"}
        </Button>
      )}

      {isSending && (
        <span style={{ fontSize: 13, color: "#78350f" }}>Sending OTP…</span>
      )}

      {/* OTP input + verify */}
      {(isAwaiting || isVerifying) && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otpCode}
            onChange={(e) => onOtpCodeChange(e.target.value.replace(/\D/g, ""))}
            style={{ width: 160, letterSpacing: 4, fontWeight: 700 }}
            disabled={isVerifying}
          />
          <Button
            type="button"
            onClick={onVerifyOtp}
            disabled={isVerifying || otpCode.length !== 6}
          >
            {isVerifying ? "Verifying…" : "Verify"}
          </Button>
          {isAwaiting && otpState.countdown > 0 && (
            <span style={{ fontSize: 12, color: "#92400e" }}>
              Resend in {otpState.countdown}s
            </span>
          )}
          {isAwaiting && otpState.countdown === 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={onSendOtp}
              style={{ fontSize: 12 }}
            >
              Resend OTP
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
