"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useCrm } from "@/providers/crm-provider";
import { ControlledLocationSelector } from "@/components/location/ControlledLocationSelector";
import { pospFormSchema, type PospFormValues } from "@/lib/schemas";
import type { LocationValue } from "@/components/location/ControlledLocationSelector";
import type { Posp } from "@/lib/types";

interface PospModalProps {
  open: boolean;
  pospItem: Posp | null;
  onClose: () => void;
}

const emptyLocation: LocationValue = {
  stateId: null,
  stateName: null,
  districtId: null,
  districtName: null,
  cityId: null,
  cityName: null,
};

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
  const [location, setLocation] = useState<LocationValue>(emptyLocation);
  const [errors, setErrors] =
    useState<Partial<Record<keyof PospFormValues, string>>>({});

  useEffect(() => {
    if (!open) {
      setErrors({});
      return;
    }
    setErrors({});
    if (pospItem) {
      setForm({
        name: pospItem.name,
        code: pospItem.code,
        mobile: pospItem.mobile ?? "",
        email: pospItem.email ?? "",
        joined: pospItem.joined
          ? new Date(pospItem.joined).toISOString().slice(0, 10)
          : "",
        active: String(!!pospItem.active),
      });
      setLocation({
        stateId:
          ((pospItem as unknown as Record<string, unknown>)
            .stateId as string | null) ?? null,
        stateName:
          ((pospItem as unknown as Record<string, unknown>)
            .stateName as string | null) ?? null,
        districtId:
          ((pospItem as unknown as Record<string, unknown>)
            .districtId as string | null) ?? null,
        districtName:
          ((pospItem as unknown as Record<string, unknown>)
            .districtName as string | null) ?? null,
        cityId:
          ((pospItem as unknown as Record<string, unknown>)
            .cityId as string | null) ?? null,
        cityName:
          ((pospItem as unknown as Record<string, unknown>)
            .cityName as string | null) ?? null,
      });
    } else {
      setForm(emptyForm);
      setLocation(emptyLocation);
    }
  }, [open, pospItem]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = pospFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof PospFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof PospFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await savePosp({
      id: pospItem?.id,
      name: form.name.trim(),
      code: form.code.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      joined: new Date(form.joined),
      active: form.active === "true",
      ...location,
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
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && (
              <span className="field-error">{errors.name}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="p-code">POSP Code</label>
            <input
              id="p-code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            {errors.code && (
              <span className="field-error">{errors.code}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="p-mobile">Mobile</label>
            <input
              id="p-mobile"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
            {errors.mobile && (
              <span className="field-error">{errors.mobile}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="p-email">Email</label>
            <input
              id="p-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="p-joined">Joined Date</label>
            <input
              id="p-joined"
              type="date"
              value={form.joined}
              onChange={(e) => setForm({ ...form, joined: e.target.value })}
            />
            {errors.joined && (
              <span className="field-error">{errors.joined}</span>
            )}
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

          <ControlledLocationSelector value={location} onChange={setLocation} />
        </div>
      </form>
    </Modal>
  );
}
