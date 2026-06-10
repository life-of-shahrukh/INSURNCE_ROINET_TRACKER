"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { POLICY_TYPES } from "@/lib/constants";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import { CustomerSearchSelect } from "@/components/customer/CustomerSearchSelect";
import { dealFormSchema, type DealFormValues } from "@/lib/schemas";
import type { Deal, DealStatus } from "@/lib/types";

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
  margin: "0",
  status: "W" as DealStatus,
  expected: "",
  proposal: "",
  policyNo: "",
  issued: "",
  remarks: "",
};

export function DealModal({ open, deal, onClose }: DealModalProps) {
  const { user } = useAuth();
  const { posp, saveDeal } = useCrm();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DealFormValues, string>>>({});

  // Sync posp into a ref so the effect reads the latest value without
  // listing it as a dependency — prevents form resets while typing.
  const pospRef = useRef(posp);
  pospRef.current = posp;

  const activePosp = posp.filter((p) => p.active);
  const canSelectPosp = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!open) return;
    setErrors({});
    const firstActive = pospRef.current.filter((p) => p.active)[0]?.id ?? "";
    if (deal) {
      setForm({
        pospId: deal.pospId,
        customerId:
          (deal as unknown as Record<string, unknown>).customerId as string ?? "",
        customer: deal.customer,
        policy: deal.policy,
        sum: String(deal.sum ?? ""),
        premium: String(deal.premium ?? ""),
        coa: String(deal.coa ?? 0),
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
      setForm({ ...emptyForm, pospId: firstActive });
    }
  }, [open, deal]); // pospRef is intentionally omitted — it is always current via .current

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
    await saveDeal({
      id: deal?.id,
      pospId: form.pospId,
      customer: form.customer.trim(),
      policy: form.policy,
      sum: +form.sum || 0,
      premium: +form.premium || 0,
      coa: +form.coa || 0,
      margin: +form.margin || 0,
      status: form.status,
      expected: new Date(form.expected),
      proposal: form.proposal.trim(),
      policyNo: form.policyNo.trim(),
      issued: new Date(form.issued),
      remarks: form.remarks.trim(),
      ...(form.customerId ? { customerId: form.customerId } : {}),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      title={deal ? "Edit Deal" : "New Deal"}
      onClose={onClose}
      footer={
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="deal-form">
            Save Deal
          </Button>
        </div>
      }
    >
      <form id="deal-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="d-posp">POSP Name</label>
            <select
              id="d-posp"
              required
              value={form.pospId}
              disabled={!canSelectPosp}
              onChange={(e) => setForm({ ...form, pospId: e.target.value })}
            >
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

          <CustomerSearchSelect
            value={form.customerId || null}
            displayValue={form.customer || null}
            onChange={(id, name) =>
              setForm({ ...form, customerId: id ?? "", customer: name ?? "" })
            }
            label="Customer Name"
            allowFreeText
          />
          {errors.customer && (
            <span className="field-error" style={{ marginTop: -10 }}>
              {errors.customer}
            </span>
          )}

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
            <label htmlFor="d-coa">COA (₹)</label>
            <input
              id="d-coa"
              type="number"
              value={form.coa}
              onChange={(e) => setForm({ ...form, coa: e.target.value })}
            />
            {errors.coa && <span className="field-error">{errors.coa}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="d-margin">Retained Margin (₹)</label>
            <input
              id="d-margin"
              type="number"
              value={form.margin}
              onChange={(e) => setForm({ ...form, margin: e.target.value })}
            />
            {errors.margin && (
              <span className="field-error">{errors.margin}</span>
            )}
          </div>
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
          <div className="form-group">
            <label htmlFor="d-proposal">Proposal Number</label>
            <input
              id="d-proposal"
              value={form.proposal}
              onChange={(e) => setForm({ ...form, proposal: e.target.value })}
            />
            {errors.proposal && (
              <span className="field-error">{errors.proposal}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="d-policyno">Policy Number</label>
            <input
              id="d-policyno"
              value={form.policyNo}
              onChange={(e) => setForm({ ...form, policyNo: e.target.value })}
            />
            {errors.policyNo && (
              <span className="field-error">{errors.policyNo}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="d-issued">Issuance Date</label>
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
