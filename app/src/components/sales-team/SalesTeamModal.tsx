"use client";

import { useEffect, useState } from "react";
import { useCreateSalesTeam, useUpdateSalesTeam } from "@/hooks/useSalesTeam";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { salesTeamFormSchema, type SalesTeamFormValues } from "@/lib/schemas";
import type { SalesTeam, CreateSalesTeamInput } from "@/lib/api/sales-team-api";

interface SalesTeamModalProps {
  open: boolean;
  member: SalesTeam | null;
  teamList: SalesTeam[];
  onClose: () => void;
}

const DESIGNATIONS = ["ASM", "ZH", "RH", "SM", "TL", "AGENT"] as const;

const empty: CreateSalesTeamInput & { status: string } = {
  userId: "",
  name: "",
  employeeCode: "",
  designation: "ASM",
  managerId: "",
  territory: "",
  mobile: "",
  email: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  status: "ACTIVE",
};

export function SalesTeamModal({
  open,
  member,
  teamList,
  onClose,
}: SalesTeamModalProps) {
  const create = useCreateSalesTeam();
  const update = useUpdateSalesTeam();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] =
    useState<Partial<Record<keyof SalesTeamFormValues, string>>>({});

  useEffect(() => {
    if (!open) {
      setErrors({});
      return;
    }
    setErrors({});
    if (member) {
      setForm({
        userId: member.userId,
        name: member.name,
        employeeCode: member.employeeCode,
        designation: member.designation,
        managerId: member.managerId || "",
        territory: member.territory || "",
        mobile: member.mobile,
        email: member.email,
        joiningDate: member.joiningDate?.slice(0, 10) || "",
        status: member.status,
      });
    } else {
      setForm(empty);
    }
  }, [open, member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = salesTeamFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<
        Record<keyof SalesTeamFormValues, string>
      > = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof SalesTeamFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      const payload = {
        ...form,
        managerId: form.managerId || undefined,
      };
      if (member) {
        await update.mutateAsync({ id: member.id, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch {
      alert("Failed to save team member");
    }
  };

  const managers = teamList.filter((t) => !member || t.id !== member.id);

  return (
    <Modal
      open={open}
      title={member ? "Edit Team Member" : "Add Team Member"}
      onClose={onClose}
      footer={
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="team-form"
            disabled={create.isPending || update.isPending}
          >
            {create.isPending || update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      <form id="team-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="tm-name">Full Name *</label>
            <input
              id="tm-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && (
              <span className="field-error">{errors.name}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="tm-code">Employee Code *</label>
            <input
              id="tm-code"
              value={form.employeeCode}
              onChange={(e) =>
                setForm({ ...form, employeeCode: e.target.value })
              }
            />
            {errors.employeeCode && (
              <span className="field-error">{errors.employeeCode}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="tm-designation">Designation *</label>
            <select
              id="tm-designation"
              value={form.designation}
              onChange={(e) =>
                setForm({ ...form, designation: e.target.value })
              }
            >
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.designation && (
              <span className="field-error">{errors.designation}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="tm-manager">Reports To</label>
            <select
              id="tm-manager"
              value={form.managerId}
              onChange={(e) =>
                setForm({ ...form, managerId: e.target.value })
              }
            >
              <option value="">(No manager)</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.designation}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tm-mobile">Mobile *</label>
            <input
              id="tm-mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
            {errors.mobile && (
              <span className="field-error">{errors.mobile}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="tm-email">Email *</label>
            <input
              id="tm-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="tm-territory">Territory</label>
            <input
              id="tm-territory"
              value={form.territory}
              onChange={(e) => setForm({ ...form, territory: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tm-joining">Joining Date *</label>
            <input
              id="tm-joining"
              type="date"
              value={form.joiningDate}
              onChange={(e) =>
                setForm({ ...form, joiningDate: e.target.value })
              }
            />
            {errors.joiningDate && (
              <span className="field-error">{errors.joiningDate}</span>
            )}
          </div>
          {member && (
            <div className="form-group">
              <label htmlFor="tm-status">Status</label>
              <select
                id="tm-status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
              {errors.status && (
                <span className="field-error">{errors.status}</span>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
