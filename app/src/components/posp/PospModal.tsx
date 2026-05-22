"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useCrm } from "@/providers/crm-provider";
import type { Posp } from "@/lib/types";

interface PospModalProps {
  open: boolean;
  pospItem: Posp | null;
  onClose: () => void;
}

const emptyForm = {
  name: "",
  code: "",
  mobile: "",
  email: "",
  joined: "",
  active: "true",
};

export function PospModal({ open, pospItem, onClose }: PospModalProps) {
  const { savePosp } = useCrm();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pospItem) {
      setForm({
        name: pospItem.name,
        code: pospItem.code,
        mobile: pospItem.mobile ?? "",
        email: pospItem.email ?? "",
        joined: pospItem.joined ?? "",
        active: String(!!pospItem.active),
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, pospItem]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await savePosp({
      id: pospItem?.id,
      name: form.name.trim(),
      code: form.code.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      joined: form.joined,
      active: form.active === "true",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      title={pospItem ? "Edit POSP" : "New POSP"}
      onClose={onClose}
      footer={
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="posp-form">
            Save POSP
          </Button>
        </div>
      }
    >
      <form id="posp-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="p-name">Full Name</label>
            <input
              id="p-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="p-code">POSP Code</label>
            <input
              id="p-code"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="p-mobile">Mobile</label>
            <input
              id="p-mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="p-email">Email</label>
            <input
              id="p-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="p-joined">Joined Date</label>
            <input
              id="p-joined"
              type="date"
              value={form.joined}
              onChange={(e) => setForm({ ...form, joined: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="p-active">Status</label>
            <select
              id="p-active"
              value={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.value })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
