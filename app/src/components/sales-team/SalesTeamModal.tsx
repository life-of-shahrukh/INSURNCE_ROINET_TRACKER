"use client";

import { useEffect, useState } from "react";
import { useCreateSalesTeam, useUpdateSalesTeam } from "@/hooks/useSalesTeam";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { SalesTeam, CreateSalesTeamInput } from "@/lib/api/sales-team-api";

interface SalesTeamModalProps {
  open: boolean;
  member: SalesTeam | null;
  teamList: SalesTeam[];
  onClose: () => void;
}

const DESIGNATIONS = ["ASM", "ZH", "RH", "SM", "TL", "AGENT"];

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

export function SalesTeamModal({ open, member, teamList, onClose }: SalesTeamModalProps) {
  const create = useCreateSalesTeam();
  const update = useUpdateSalesTeam();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
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
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="team-form" disabled={create.isPending || update.isPending}>
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
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tm-code">Employee Code *</label>
            <input
              id="tm-code"
              required
              value={form.employeeCode}
              onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tm-designation">Designation *</label>
            <select
              id="tm-designation"
              required
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
            >
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tm-manager">Reports To</label>
            <select
              id="tm-manager"
              value={form.managerId}
              onChange={(e) => setForm({ ...form, managerId: e.target.value })}
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
              required
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="tm-email">Email *</label>
            <input
              id="tm-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
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
              required
              value={form.joiningDate}
              onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
            />
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
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
