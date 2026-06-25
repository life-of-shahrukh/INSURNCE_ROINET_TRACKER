"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useCreateCustomer } from "@/hooks/useCustomers";
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

export function QuickAddCustomerModal({
  open,
  prefillName,
  onClose,
  onCreated,
}: QuickAddCustomerModalProps): React.ReactElement | null {
  const [name, setName] = useState(prefillName);
  const [mobile, setMobile] = useState("");
  const [policyType, setPolicyType] = useState<string>(INSURANCE_PRODUCTS[0].value);
  const [mobileError, setMobileError] = useState("");

  const { mutateAsync: createCustomer, isPending } = useCreateCustomer();

  // Reset the form every time the modal opens.
  useEffect(() => {
    if (open) {
      setName(prefillName);
      setMobile("");
      setPolicyType(INSURANCE_PRODUCTS[0].value);
      setMobileError("");
    }
  }, [open, prefillName]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(digits);
    setMobileError(digits.length > 0 && digits.length < 10 ? "Mobile must be 10 digits" : "");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (mobile.length !== 10) {
      setMobileError("Mobile must be 10 digits");
      return;
    }
    setMobileError("");

    try {
      const customer = await createCustomer({ name: name.trim(), mobile: mobile.trim() });
      toast.success(`Customer "${customer.name}" added`);
      onCreated(customer, policyType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again";
      toast.error(`Failed to add customer: ${msg}`);
    }
  };

  if (!open) return null;

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
              Add New Customer
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
              Customer will be auto-selected in the deal form
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
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

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ padding: "20px 24px 24px" }}>
          {/* Name */}
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
              disabled={isPending}
            />
          </div>

          {/* Mobile */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <label htmlFor="qa-mobile">
              Mobile Number <span style={{ color: "var(--color-error, #e53e3e)" }}>*</span>
            </label>
            <input
              id="qa-mobile"
              type="tel"
              value={mobile}
              onChange={handleMobileChange}
              placeholder="10-digit mobile number"
              required
              maxLength={10}
              inputMode="numeric"
              disabled={isPending}
            />
            {mobileError && (
              <span className="field-error">{mobileError}</span>
            )}
          </div>

          {/* Insurance Interest */}
          <div className="form-group" style={{ marginTop: 14 }}>
            <label htmlFor="qa-policy-type">Insurance Interest</label>
            <select
              id="qa-policy-type"
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value)}
              disabled={isPending}
            >
              {INSURANCE_PRODUCTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <span
              style={{
                display: "block",
                marginTop: 4,
                fontSize: 11,
                color: "#999",
              }}
            >
              Auto-fills the Policy Type field in the deal
            </span>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 22,
            }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add Customer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
