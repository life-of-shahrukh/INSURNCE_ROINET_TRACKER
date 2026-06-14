"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCreateLead, useUpdateLead } from "@/hooks/useLeads";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CustomerSearchSelect } from "@/components/customer/CustomerSearchSelect";
import { leadFormSchema, type LeadFormValues } from "@/lib/schemas";
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

export function LeadModal({ open, lead, onClose }: LeadModalProps) {
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] =
    useState<Partial<Record<keyof LeadFormValues, string>>>({});

  useEffect(() => {
    if (!open) {
      setErrors({});
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
    } else {
      setForm(empty);
    }
  }, [open, lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      toast.error(`Failed to save lead: ${msg}`);
    }
  };

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
            disabled={createLead.isPending || updateLead.isPending}
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
            <CustomerSearchSelect
              value={form.customerId || null}
              onChange={(id) => {
                setForm({ ...form, customerId: id || "" });
              }}
              label="Customer"
              required
            />
            {errors.customerId && (
              <span className="field-error">{errors.customerId}</span>
            )}
          </div>

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
              <option value="THIS_MONTH">This Month</option>
              <option value="T_PLUS_1">T+1 (Next Month)</option>
              <option value="T_PLUS_2">T+2</option>
              <option value="LATER">Later</option>
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
