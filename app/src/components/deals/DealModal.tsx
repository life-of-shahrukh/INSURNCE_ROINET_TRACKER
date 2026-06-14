"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { POLICY_TYPES } from "@/lib/constants";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import { useProfile } from "@/hooks/useProfile";
import { CustomerSearchSelect } from "@/components/customer/CustomerSearchSelect";
import { dealFormSchema, type DealFormValues } from "@/lib/schemas";
import type { Deal, DealInput, DealStatus } from "@/lib/types";

interface DealModalProps {
  open: boolean;
  deal: Deal | null;
  onClose: () => void;
}

const emptyForm = {
  pospId: "",
  customerId: "",
  customer: "",
  policy: "Life",
  sum: "",
  premium: "",
  coa: "0",
  coaType: "AMOUNT" as "PERCENT" | "AMOUNT",
  margin: "0",
  status: "W" as DealStatus,
  expected: "",
  proposal: "",
  policyNo: "",
  issued: "",
  remarks: "",
};

const MANAGER_ROLES = new Set(["DM", "ASM", "RH", "ZH", "NATIONAL_HEAD", "SUPER_ADMIN"]);

export function DealModal({ open, deal, onClose }: DealModalProps) {
  const { user } = useAuth();
  const { posp, saveDeal } = useCrm();
  const { data: profile } = useProfile();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DealFormValues, string>>>({});
  const [saving, setSaving] = useState(false);
  const [savedProposal, setSavedProposal] = useState<string | null>(null);

  const isPosp = user?.role === "POSP";
  const isManager = user?.role ? MANAGER_ROLES.has(user.role) : false;
  const isEditMode = !!deal;
  // COA + Retained Margin are financial fields only SUPER_ADMIN may edit.
  const canEditFinancials = user?.role === "SUPER_ADMIN";

  // Live rupee value of a PERCENT-mode COA, for the helper text.
  const coaPreview =
    form.coaType === "PERCENT"
      ? ((+form.premium || 0) * (+form.coa || 0)) / 100
      : null;

  const activePosp = posp.filter((p) => p.active);

  // Self label shown as first dropdown option for manager roles
  const selfLabel = profile?.salesTeam?.name
    ? `— Self (${profile.salesTeam.name}) —`
    : "— Self (Me) —";

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSaving(false);
    setSavedProposal(null);

    if (deal) {
      setForm({
        pospId: deal.pospId ?? "",
        customerId:
          (deal as unknown as Record<string, unknown>).customerId as string ?? "",
        customer: deal.customer,
        policy: deal.policy,
        sum: String(deal.sum ?? ""),
        premium: String(deal.premium ?? ""),
        coa: String(deal.coa ?? 0),
        coaType: deal.coaType ?? "AMOUNT",
        margin: String(deal.margin ?? 0),
        status: deal.status,
        expected: deal.expected
          ? new Date(deal.expected).toISOString().slice(0, 10)
          : "",
        proposal: deal.proposal ?? "",
        policyNo: deal.policyNo ?? "",
        issued: deal.issued
          ? new Date(deal.issued).toISOString().slice(0, 10)
          : "",
        remarks: deal.remarks ?? "",
      });
    } else {
      // New deal: pre-fill pospId for POSP users, leave empty (Self) for managers
      const initialPospId = isPosp ? (user?.pospId ?? "") : "";
      setForm({ ...emptyForm, pospId: initialPospId });
    }
  }, [open, deal, isPosp, user?.pospId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = dealFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof DealFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof DealFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const payload: DealInput = {
        id: deal?.id,
        // Empty string means "Self" for managers → send as undefined (null in DB)
        pospId: form.pospId || undefined,
        customer: form.customer.trim(),
        policy: form.policy,
        sum: +form.sum || 0,
        premium: +form.premium || 0,
        status: form.status,
        expected: new Date(form.expected),
        remarks: form.remarks.trim(),
        // COA + Retained Margin are sent only by SUPER_ADMIN; the backend ignores
        // them from any other role, this keeps the payload clean.
        ...(canEditFinancials
          ? {
              coa: +form.coa || 0,
              coaType: form.coaType,
              margin: +form.margin || 0,
            }
          : {}),
        ...(form.customerId ? { customerId: form.customerId } : {}),
        // Proposal, policyNo, issued are only sent in edit mode
        ...(isEditMode ? {
          proposal: form.proposal.trim(),
          policyNo: form.policyNo.trim(),
          ...(form.issued ? { issued: new Date(form.issued) } : {}),
        } : {}),
      };

      const savedDeal = await saveDeal(payload);

      if (!isEditMode && savedDeal.proposal) {
        // Show the auto-generated proposal number inside the modal for 2.5 s before closing.
        setSavedProposal(savedDeal.proposal);
        toast.success(`Deal saved — Proposal: ${savedDeal.proposal}`);
        setTimeout(() => {
          setSavedProposal(null);
          onClose();
        }, 2500);
      } else {
        toast.success(`Deal ${isEditMode ? "updated" : "saved"} successfully`);
        onClose();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      toast.error(`Failed to save deal: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={deal ? "Edit Deal" : "New Deal"}
      onClose={onClose}
      footer={
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose} disabled={saving || !!savedProposal}>
            Cancel
          </Button>
          <Button type="submit" form="deal-form" disabled={saving || !!savedProposal}>
            {saving ? "Saving…" : "Save Deal"}
          </Button>
        </div>
      }
    >
      {savedProposal && (
        <div
          style={{
            background: "var(--color-success-bg, #ecfdf5)",
            border: "1.5px solid var(--color-success, #22c55e)",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 600,
            fontSize: 15,
            color: "var(--color-success-text, #15803d)",
          }}
        >
          <span style={{ fontSize: 20 }}>✓</span>
          Deal saved &mdash; Proposal ID:&nbsp;
          <span
            style={{
              fontFamily: "monospace",
              letterSpacing: "0.04em",
              background: "var(--color-success-chip-bg, #bbf7d0)",
              borderRadius: 4,
              padding: "1px 8px",
            }}
          >
            {savedProposal}
          </span>
        </div>
      )}

      <form id="deal-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* ── Issued By ────────────────────────────────────────────── */}
          <div className="form-group">
            <label htmlFor="d-posp">Issued By</label>
            <select
              id="d-posp"
              value={form.pospId}
              disabled={isPosp}
              onChange={(e) => setForm({ ...form, pospId: e.target.value })}
            >
              {/* Manager roles get a "Self" option first */}
              {isManager && (
                <option value="">{selfLabel}</option>
              )}
              {activePosp.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
            {errors.pospId && (
              <span className="field-error">{errors.pospId}</span>
            )}
          </div>

          {/* ── Customer ─────────────────────────────────────────────── */}
          <CustomerSearchSelect
            value={form.customerId || null}
            displayValue={form.customer || null}
            onChange={(id, name) =>
              setForm({ ...form, customerId: id ?? "", customer: name ?? "" })
            }
            label="Customer Name / Number"
            allowFreeText
          />
          {errors.customer && (
            <span className="field-error" style={{ marginTop: -10 }}>
              {errors.customer}
            </span>
          )}

          {/* ── Policy Type ───────────────────────────────────────────── */}
          <div className="form-group">
            <label htmlFor="d-policy">Policy Type</label>
            <select
              id="d-policy"
              required
              value={form.policy}
              onChange={(e) => setForm({ ...form, policy: e.target.value })}
            >
              {POLICY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.policy && (
              <span className="field-error">{errors.policy}</span>
            )}
          </div>

          {/* ── Financials ────────────────────────────────────────────── */}
          <div className="form-group">
            <label htmlFor="d-sum">Sum Assured (₹)</label>
            <input
              id="d-sum"
              type="number"
              value={form.sum}
              onChange={(e) => setForm({ ...form, sum: e.target.value })}
            />
            {errors.sum && <span className="field-error">{errors.sum}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="d-premium">Premium Amount (₹)</label>
            <input
              id="d-premium"
              type="number"
              value={form.premium}
              onChange={(e) => setForm({ ...form, premium: e.target.value })}
            />
            {errors.premium && (
              <span className="field-error">{errors.premium}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="d-coa">
              COA ({form.coaType === "PERCENT" ? "%" : "₹"})
              {!canEditFinancials && (
                <span style={{ fontWeight: 400, color: "#888", marginLeft: 6, fontSize: 12 }}>
                  (admin only)
                </span>
              )}
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="d-coa"
                type="number"
                style={{ flex: 1 }}
                value={form.coa}
                disabled={!canEditFinancials}
                onChange={(e) => setForm({ ...form, coa: e.target.value })}
              />
              <select
                aria-label="COA mode"
                style={{ width: 80 }}
                value={form.coaType}
                disabled={!canEditFinancials}
                onChange={(e) =>
                  setForm({ ...form, coaType: e.target.value as "PERCENT" | "AMOUNT" })
                }
              >
                <option value="AMOUNT">₹</option>
                <option value="PERCENT">%</option>
              </select>
            </div>
            {coaPreview !== null && (
              <span style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
                = ₹{coaPreview.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            )}
            {errors.coa && <span className="field-error">{errors.coa}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="d-margin">
              Retained Margin (₹)
              {!canEditFinancials && (
                <span style={{ fontWeight: 400, color: "#888", marginLeft: 6, fontSize: 12 }}>
                  (admin only)
                </span>
              )}
            </label>
            <input
              id="d-margin"
              type="number"
              value={form.margin}
              disabled={!canEditFinancials}
              onChange={(e) => setForm({ ...form, margin: e.target.value })}
            />
            {errors.margin && (
              <span className="field-error">{errors.margin}</span>
            )}
          </div>

          {/* ── Status & Closure Date ─────────────────────────────────── */}
          <div className="form-group">
            <label htmlFor="d-status">Deal Status</label>
            <select
              id="d-status"
              required
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as DealStatus })
              }
            >
              <option value="H">Hot</option>
              <option value="W">Warm</option>
              <option value="C">Cold</option>
            </select>
            {errors.status && (
              <span className="field-error">{errors.status}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="d-expected">Expected Closure Date</label>
            <input
              id="d-expected"
              type="date"
              value={form.expected}
              onChange={(e) => setForm({ ...form, expected: e.target.value })}
            />
            {errors.expected && (
              <span className="field-error">{errors.expected}</span>
            )}
          </div>

          {/* ── Proposal Number — only in edit mode (backend generates on create) */}
          {isEditMode && (
            <div className="form-group">
              <label htmlFor="d-proposal">
                Proposal Number
                <span style={{ fontWeight: 400, color: "#888", marginLeft: 6, fontSize: 12 }}>
                  (assigned by insurer)
                </span>
              </label>
              <input
                id="d-proposal"
                value={form.proposal}
                placeholder="e.g. PRP-2024-123456"
                onChange={(e) => setForm({ ...form, proposal: e.target.value })}
              />
              {errors.proposal && (
                <span className="field-error">{errors.proposal}</span>
              )}
            </div>
          )}

          {/* ── Policy Number — only in edit mode (assigned after policy issued) */}
          {isEditMode && (
            <div className="form-group">
              <label htmlFor="d-policyno">
                Policy Number
                <span style={{ fontWeight: 400, color: "#888", marginLeft: 6, fontSize: 12 }}>
                  (issued after premium receipt &amp; approval)
                </span>
              </label>
              <input
                id="d-policyno"
                value={form.policyNo}
                placeholder="e.g. POL-2024-987654"
                onChange={(e) => setForm({ ...form, policyNo: e.target.value })}
              />
              {errors.policyNo && (
                <span className="field-error">{errors.policyNo}</span>
              )}
            </div>
          )}

          {/* ── Issuance Date — only in edit mode */}
          {isEditMode && (
            <div className="form-group">
              <label htmlFor="d-issued">
                Issuance Date
                <span style={{ fontWeight: 400, color: "#888", marginLeft: 6, fontSize: 12 }}>
                  (date policy document was issued)
                </span>
              </label>
              <input
                id="d-issued"
                type="date"
                value={form.issued}
                onChange={(e) => setForm({ ...form, issued: e.target.value })}
              />
              {errors.issued && (
                <span className="field-error">{errors.issued}</span>
              )}
            </div>
          )}

          {/* ── Remarks ───────────────────────────────────────────────── */}
          <div className="form-group full">
            <label htmlFor="d-remarks">Remarks</label>
            <textarea
              id="d-remarks"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
            {errors.remarks && (
              <span className="field-error">{errors.remarks}</span>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
