"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { TrashIconButton } from "@/components/ui/TrashIconButton";
import { Modal } from "@/components/ui/Modal";
import { useCrm } from "@/providers/crm-provider";
import { useAuth } from "@/providers/auth-provider";
import { useProfile } from "@/hooks/useProfile";
import { useCreateLead, useUpdateLead, useDeleteLead } from "@/hooks/useLeads";
import { useUpdateDeal } from "@/hooks/useUpdateDeal";
import { CustomerSearchSelect } from "@/components/customer/CustomerSearchSelect";
import { QuickAddCustomerModal } from "@/components/customer/QuickAddCustomerModal";
import { ProductCategorySelect } from "@/components/ui/ProductCategorySelect";
import { dealFormSchema, type DealFormValues } from "@/lib/schemas";
import type { Deal, DealInput, DealStatus } from "@/lib/types";
import type { Lead } from "@/lib/api/lead-api";
import type { Customer } from "@/lib/api/customer-api";
import { formatPospLabel } from "@/lib/posp-display";
import {
  closureTimelineToHeatStatus,
  deriveClosureTimelineFromDate,
  heatStatusToClosureTimeline,
  suggestedExpectedCloseDateForTimeline,
} from "@/lib/closure-timeline";
import {
  formToCreateLeadInput,
  formToUpdateLeadInput,
} from "@/lib/lead-deal-mapper";

interface DealModalProps {
  open: boolean;
  /** Lead being edited (pipeline create/edit flow). */
  lead?: Lead | null;
  /** Issued deal being edited from Deals Tracker. */
  deal?: Deal | null;
  onClose: () => void;
}

const emptyForm = {
  pospId: "",
  customerId: "",
  customer: "",
  policy: "HEALTH",
  productSubType: "",
  sum: "",
  premium: "",
  coa: "0",
  coaType: "AMOUNT" as "PERCENT" | "AMOUNT",
  margin: "0",
  status: "W" as DealStatus,
  pipelineStatus: "NEW" as string,
  expected: "",
  proposal: "",
  policyNo: "",
  issued: "",
  remarks: "",
};

const MANAGER_ROLES = new Set(["DM", "ASM", "RH", "ZH", "NATIONAL_HEAD", "SUPER_ADMIN"]);

export function DealModal({ open, lead, deal, onClose }: DealModalProps) {
  const { user } = useAuth();
  const { posp } = useCrm();
  const updateDeal = useUpdateDeal();
  const { data: profile } = useProfile();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DealFormValues, string>>>({});
  const [saving, setSaving] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddName, setQuickAddName] = useState("");

  const isPosp = user?.role === "POSP";
  const isManager = user?.role ? MANAGER_ROLES.has(user.role) : false;
  const isEditMode = !!lead || !!deal;
  const isDealEdit = !!deal && !lead;
  const isConvertedLead = !!lead?.convertedToDealId;
  const isDoneDeal = isDealEdit || isConvertedLead;
  const canEditFinancials = user?.role === "SUPER_ADMIN";

  const coaPreview =
    form.coaType === "PERCENT"
      ? ((+form.premium || 0) * (+form.coa || 0)) / 100
      : null;

  const activePosp = posp.filter((p) => p.active);

  const selfLabel = profile?.salesTeam?.name
    ? `— Self (${profile.salesTeam.name}) —`
    : "— Self (Me) —";

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setSaving(false);

    if (lead) {
      setForm({
        pospId: lead.pospId ?? "",
        customerId: lead.customerId,
        customer: lead.customer?.name ?? "",
        policy: lead.product,
        productSubType: lead.productSubType ?? "",
        sum: String(lead.estimatedSum ?? ""),
        premium: String(lead.estimatedPremium ?? ""),
        coa: "0",
        coaType: "AMOUNT",
        margin: "0",
        status: lead.convertedToDealId
          ? "D"
          : closureTimelineToHeatStatus(lead.closureTimeline),
        pipelineStatus: lead.status ?? "NEW",
        expected: lead.expectedCloseDate
          ? new Date(lead.expectedCloseDate).toISOString().slice(0, 10)
          : "",
        proposal: lead.convertedDeal?.proposal ?? "",
        policyNo: lead.convertedDeal?.policyNo ?? "",
        issued: lead.convertedDeal?.issued
          ? new Date(lead.convertedDeal.issued).toISOString().slice(0, 10)
          : "",
        remarks: lead.remarks ?? "",
      });
    } else if (deal) {
      setForm({
        pospId: deal.pospId ?? "",
        customerId: deal.customerId ?? "",
        customer: deal.customer,
        policy: deal.policy,
        productSubType: "",
        sum: String(deal.sum ?? ""),
        premium: String(deal.premium ?? ""),
        coa: String(deal.coa ?? 0),
        coaType: deal.coaType ?? "AMOUNT",
        margin: String(deal.margin ?? 0),
        status: "D",
        pipelineStatus: "WON",
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
      const initialPospId = isPosp ? (user?.pospId ?? "") : "";
      setForm({ ...emptyForm, pospId: initialPospId });
    }
  }, [open, lead, deal, isPosp, user?.pospId]);

  const handleCustomerCreated = (customer: Customer, policyType: string) => {
    setQuickAddOpen(false);
    setForm((prev) => ({
      ...prev,
      customerId: customer.id,
      customer: customer.name,
      policy: policyType,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const result = dealFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof DealFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof DealFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      const firstMessage = result.error.issues[0]?.message;
      toast.error(firstMessage ?? "Please fix the highlighted fields");
      return;
    }

    if (!form.customerId) {
      setErrors({ customer: "Please select a customer" });
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      if (isDealEdit && deal) {
        const payload: DealInput = {
          id: deal.id,
          pospId: form.pospId || undefined,
          customer: form.customer.trim(),
          policy: form.policy,
          sum: +form.sum || 0,
          premium: +form.premium || 0,
          status: "D",
          expected: new Date(form.expected),
          remarks: form.remarks.trim(),
          ...(canEditFinancials
            ? {
                coa: +form.coa || 0,
                coaType: form.coaType,
                margin: +form.margin || 0,
              }
            : {}),
          ...(form.customerId ? { customerId: form.customerId } : {}),
          proposal: form.proposal.trim(),
          policyNo: form.policyNo.trim(),
          ...(form.issued ? { issued: new Date(form.issued) } : {}),
        };
        await updateDeal.mutateAsync({ id: deal.id, data: payload });
        toast.success("Deal updated successfully");
        onClose();
        return;
      }

      if (lead) {
        // Guard: transitioning to PROPOSAL_SENT generates an irreversible Proposal ID
        const isNewProposalSentTransition =
          form.pipelineStatus === "PROPOSAL_SENT" &&
          lead.status !== "PROPOSAL_SENT" &&
          !lead.proposalCode;

        if (
          isNewProposalSentTransition &&
          !window.confirm(
            'Moving to "Proposal Sent" will auto-generate a Proposal ID (e.g. PROP-2026-00001).\n\n' +
            "This action cannot be undone — the Proposal ID is permanent once created.\n\n" +
            "Continue?",
          )
        ) {
          setSaving(false);
          return;
        }

        await updateLead.mutateAsync({
          id: lead.id,
          data: formToUpdateLeadInput(form),
        });
        const converted = !!form.policyNo?.trim() && !lead.convertedToDealId;
        toast.success(
          converted
            ? "Lead converted to deal successfully"
            : isNewProposalSentTransition
              ? "Pipeline status updated — Proposal ID generated"
              : "Lead updated successfully",
        );
        onClose();
        return;
      }

      await createLead.mutateAsync(formToCreateLeadInput(form));
      toast.success("Lead created successfully");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      toast.error(
        isDealEdit ? `Failed to save deal: ${msg}` : `Failed to save lead: ${msg}`,
      );
    } finally {
      setSaving(false);
    }
  };

  const canDeleteLead = !!lead && !isDealEdit && !isConvertedLead;

  const handleDeleteLead = async (): Promise<void> => {
    if (!lead || !canDeleteLead) return;
    if (!confirm(`Delete lead for ${lead.customer?.name ?? "this customer"}?`)) return;
    setSaving(true);
    try {
      await deleteLead.mutateAsync(lead.id);
      toast.success("Lead deleted");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      toast.error(`Failed to delete lead: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = isEditMode
    ? isDealEdit
      ? "Edit Deal"
      : "Edit Lead"
    : "New Lead";

  return (
    <>
      <QuickAddCustomerModal
        open={quickAddOpen}
        prefillName={quickAddName}
        onClose={() => setQuickAddOpen(false)}
        onCreated={handleCustomerCreated}
      />
      <Modal
        open={open}
        title={modalTitle}
        onClose={onClose}
        footer={
          <div className="modal-footer" style={{ justifyContent: "space-between" }}>
            <div>
              {canDeleteLead ? (
                <TrashIconButton
                  onClick={() => void handleDeleteLead()}
                  title="Delete lead"
                  disabled={saving}
                />
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" form="deal-form" disabled={saving}>
                {saving ? "Saving…" : isDealEdit ? "Save Deal" : "Save Lead"}
              </Button>
            </div>
          </div>
        }
      >
        <form id="deal-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="d-posp">Issued By</label>
              {isPosp ? (
                <input
                  id="d-posp"
                  type="text"
                  disabled
                  value={
                    activePosp.find((p) => p.id === form.pospId)
                      ? formatPospLabel(
                          activePosp.find((p) => p.id === form.pospId)!.name,
                          activePosp.find((p) => p.id === form.pospId)!.code,
                        )
                      : profile?.posp
                        ? formatPospLabel(
                            profile.posp.name,
                            profile.posp.code,
                          )
                        : "Self"
                  }
                  style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
                />
              ) : (
                <select
                  id="d-posp"
                  value={form.pospId}
                  disabled={isEditMode}
                  onChange={(e) => setForm({ ...form, pospId: e.target.value })}
                >
                  {isManager && <option value="">{selfLabel}</option>}
                  {activePosp.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPospLabel(p.name, p.code)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <CustomerSearchSelect
              value={form.customerId || null}
              displayValue={form.customer || null}
              onChange={(id, name) =>
                setForm({ ...form, customerId: id ?? "", customer: name ?? "" })
              }
              label="Customer Name / Number"
              allowFreeText
              onAddNew={(prefillName) => {
                setQuickAddName(prefillName);
                setQuickAddOpen(true);
              }}
            />
            {errors.customer && (
              <span className="field-error" style={{ marginTop: -10 }}>
                {errors.customer}
              </span>
            )}

            <ProductCategorySelect
              productLine={form.policy}
              productSubType={form.productSubType}
              onProductLineChange={(val) => setForm({ ...form, policy: val, productSubType: "" })}
              onSubTypeChange={(val) => setForm({ ...form, productSubType: val })}
              required
            />

            <div className="form-group">
              <label htmlFor="d-sum">Sum Assured (₹)</label>
              <input
                id="d-sum"
                type="number"
                value={form.sum}
                onChange={(e) => setForm({ ...form, sum: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="d-premium">Premium Amount (₹)</label>
              <input
                id="d-premium"
                type="number"
                value={form.premium}
                onChange={(e) => setForm({ ...form, premium: e.target.value })}
              />
            </div>

            {isEditMode && (
              <>
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
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="d-status">Temperature</label>
              {isDoneDeal ? (
                <input
                  id="d-status"
                  value="Done"
                  disabled
                  readOnly
                />
              ) : (
                <select
                  id="d-status"
                  required
                  value={form.status}
                  onChange={(e) => {
                    const status = e.target.value as Exclude<DealStatus, "D">;
                    const timeline = heatStatusToClosureTimeline(status);
                    setForm({
                      ...form,
                      status,
                      expected: suggestedExpectedCloseDateForTimeline(timeline),
                    });
                  }}
                >
                  <option value="H">Hot — this month</option>
                  <option value="W">Warm — next month (T+1)</option>
                  <option value="C">Cold — within 2 months (T+2)</option>
                  <option value="L">Later — more than 2 months</option>
                </select>
              )}
            </div>

            {/* Pipeline status — only shown when editing a lead (not a standalone deal) */}
            {!!lead && !isDealEdit && (
              <div className="form-group">
                <label htmlFor="d-pipeline-status">
                  Pipeline Status
                  {lead.proposalCode && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: "#d97706", fontWeight: 400 }}>
                      🔒 cannot go below this stage
                    </span>
                  )}
                </label>
                <select
                  id="d-pipeline-status"
                  value={form.pipelineStatus}
                  onChange={(e) => setForm({ ...form, pipelineStatus: e.target.value })}
                  disabled={isConvertedLead}
                >
                  {!lead.proposalCode && <option value="NEW">New</option>}
                  {!lead.proposalCode && <option value="CONTACTED">Contacted</option>}
                  {!lead.proposalCode && <option value="QUALIFIED">Qualified</option>}
                  <option value="PROPOSAL_SENT">Proposal Sent</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label htmlFor="d-expected">Expected Closure Date</label>
              <input
                id="d-expected"
                type="date"
                value={form.expected}
                onChange={(e) => {
                  const expected = e.target.value;
                  const timeline = expected
                    ? deriveClosureTimelineFromDate(expected)
                    : null;
                  setForm({
                    ...form,
                    expected,
                    ...(timeline
                      ? { status: closureTimelineToHeatStatus(timeline) as DealStatus }
                      : {}),
                  });
                }}
              />
            </div>

            {isEditMode && (
              <>
                <div className="form-group">
                  <label htmlFor="d-proposal">
                    Proposal Number
                    {lead?.proposalCode ? (
                      <span style={{ fontWeight: 400, color: "#d97706", marginLeft: 6, fontSize: 12 }}>
                        🔒 auto-generated · permanent
                      </span>
                    ) : (
                      <span style={{ fontWeight: 400, color: "#888", marginLeft: 6, fontSize: 12 }}>
                        (assigned by insurer)
                      </span>
                    )}
                  </label>
                  {lead?.proposalCode ? (
                    <input
                      id="d-proposal"
                      value={lead.proposalCode}
                      readOnly
                      disabled
                      style={{ background: "#fffbeb", color: "#78350f", fontWeight: 700, cursor: "not-allowed", letterSpacing: "0.04em" }}
                    />
                  ) : (
                    <input
                      id="d-proposal"
                      value={form.proposal}
                      placeholder="e.g. PRP-2024-123456"
                      onChange={(e) => setForm({ ...form, proposal: e.target.value })}
                    />
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="d-policyno">
                    Policy Number
                    <span style={{ fontWeight: 400, color: "#888", marginLeft: 6, fontSize: 12 }}>
                      (add to convert lead to deal)
                    </span>
                  </label>
                  <input
                    id="d-policyno"
                    value={form.policyNo}
                    placeholder="e.g. POL-2024-987654"
                    disabled={isConvertedLead && !isDealEdit}
                    onChange={(e) => setForm({ ...form, policyNo: e.target.value })}
                  />
                </div>
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
                </div>
              </>
            )}

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
    </>
  );
}
