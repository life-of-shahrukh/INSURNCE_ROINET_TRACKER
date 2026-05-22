"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { POLICY_TYPES } from "@/lib/constants";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import type { Deal, DealStatus } from "@/lib/types";

interface DealModalProps {
  open: boolean;
  deal: Deal | null;
  onClose: () => void;
}

const emptyForm = {
  pospId: "",
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
  const activePosp = posp.filter((p) => p.active);
  const canSelectPosp = user?.role === "ADMIN";

  useEffect(() => {
    if (!open) return;
    if (deal) {
      setForm({
        pospId: deal.pospId,
        customer: deal.customer,
        policy: deal.policy,
        sum: String(deal.sum ?? ""),
        premium: String(deal.premium ?? ""),
        coa: String(deal.coa ?? 0),
        margin: String(deal.margin ?? 0),
        status: deal.status,
        expected: deal.expected ?? "",
        proposal: deal.proposal ?? "",
        policyNo: deal.policyNo ?? "",
        issued: deal.issued ?? "",
        remarks: deal.remarks ?? "",
      });
    } else {
      setForm({
        ...emptyForm,
        pospId: activePosp[0]?.id ?? "",
      });
    }
  }, [open, deal, posp]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
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
      expected: form.expected,
      proposal: form.proposal.trim(),
      policyNo: form.policyNo.trim(),
      issued: form.issued,
      remarks: form.remarks.trim(),
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
          </div>
          <div className="form-group">
            <label htmlFor="d-customer">Customer Name</label>
            <input
              id="d-customer"
              required
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
            />
          </div>
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
          </div>
          <div className="form-group">
            <label htmlFor="d-sum">Sum Assured (₹)</label>
            <input
              id="d-sum"
              type="number"
              required
              value={form.sum}
              onChange={(e) => setForm({ ...form, sum: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="d-premium">Premium Amount (₹)</label>
            <input
              id="d-premium"
              type="number"
              required
              value={form.premium}
              onChange={(e) => setForm({ ...form, premium: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="d-coa">COA (₹)</label>
            <input
              id="d-coa"
              type="number"
              value={form.coa}
              onChange={(e) => setForm({ ...form, coa: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="d-margin">Retained Margin (₹)</label>
            <input
              id="d-margin"
              type="number"
              value={form.margin}
              onChange={(e) => setForm({ ...form, margin: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="d-status">Deal Status</label>
            <select
              id="d-status"
              required
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as DealStatus })}
            >
              <option value="H">Hot</option>
              <option value="W">Warm</option>
              <option value="C">Cold</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="d-expected">Expected Closure Date</label>
            <input
              id="d-expected"
              type="date"
              value={form.expected}
              onChange={(e) => setForm({ ...form, expected: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="d-proposal">Proposal Number</label>
            <input
              id="d-proposal"
              value={form.proposal}
              onChange={(e) => setForm({ ...form, proposal: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="d-policyno">Policy Number</label>
            <input
              id="d-policyno"
              value={form.policyNo}
              onChange={(e) => setForm({ ...form, policyNo: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="d-issued">Issuance Date</label>
            <input
              id="d-issued"
              type="date"
              value={form.issued}
              onChange={(e) => setForm({ ...form, issued: e.target.value })}
            />
          </div>
          <div className="form-group full">
            <label htmlFor="d-remarks">Remarks</label>
            <textarea
              id="d-remarks"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
