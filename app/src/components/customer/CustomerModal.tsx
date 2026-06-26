"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { LocationSelector } from "@/components/location/LocationSelector";
import { customerFormSchema, type CustomerFormValues } from "@/lib/schemas";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { useProfile } from "@/hooks/useProfile";
import { useDistrictById } from "@/hooks/useExternalApi";
import type { Customer } from "@/lib/api/customer-api";

interface CustomerModalProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  prefillName?: string;
}

const emptyForm: CustomerFormValues = {
  name: "",
  email: "",
  mobile: "",
  alternateMobile: "",
  dateOfBirth: "",
  panNumber: "",
  aadharNumber: "",
  stateId: "",
  stateName: "",
  districtId: "",
  districtName: "",
  cityId: "",
  cityName: "",
  address: "",
  pincode: "",
  source: "",
  kycStatus: "PENDING",
};

export function CustomerModal({
  open,
  customer,
  onClose,
  prefillName,
}: CustomerModalProps): React.ReactElement | null {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const { data: profile } = useProfile();
  const pospDistrictId = profile?.posp?.districtId ?? null;
  const { data: pospDistrict } = useDistrictById(!customer ? pospDistrictId : null);
  const [form, setForm] = useState<CustomerFormValues>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormValues, string>>>({});

  const isSaving = createCustomer.isPending || updateCustomer.isPending;
  const isEdit = !!customer;

  // Populate form when modal opens
  useEffect(() => {
    if (!open) {
      setErrors({});
      return;
    }
    setErrors({});

    if (customer) {
      setForm({
        name: customer.name ?? "",
        email: customer.email ?? "",
        mobile: customer.mobile ?? "",
        alternateMobile: customer.alternateMobile ?? "",
        dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.slice(0, 10) : "",
        panNumber: customer.panNumber ?? "",
        aadharNumber: customer.aadharNumber ?? "",
        stateId: customer.stateId ?? "",
        stateName: customer.stateName ?? "",
        districtId: customer.districtId ?? "",
        districtName: customer.districtName ?? "",
        cityId: customer.cityId ?? "",
        cityName: customer.cityName ?? "",
        address: customer.address ?? "",
        pincode: customer.pincode ?? "",
        source: customer.source ?? "",
        kycStatus: customer.kycStatus ?? "PENDING",
      });
    } else {
      // New customer — pre-fill from POSP's territory if resolved
      setForm({
        ...emptyForm,
        name: prefillName?.trim() ?? "",
        stateId: pospDistrict?.stateId ?? "",
        districtId: pospDistrict?.districtId ?? "",
        districtName: pospDistrict?.districtName ?? "",
      });
    }
  }, [open, customer, prefillName, pospDistrict]);

  const set = <K extends keyof CustomerFormValues>(key: K, val: CustomerFormValues[K]): void =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const result = customerFormSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CustomerFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CustomerFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error(result.error.issues[0]?.message ?? "Please fix the highlighted fields");
      return;
    }
    setErrors({});

    try {
      const payload = {
        ...form,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : undefined,
        email: form.email || undefined,
        alternateMobile: form.alternateMobile || undefined,
        panNumber: form.panNumber || undefined,
        aadharNumber: form.aadharNumber || undefined,
        source: form.source || undefined,
        address: form.address || undefined,
        pincode: form.pincode || undefined,
        stateId: form.stateId || undefined,
        stateName: form.stateName || undefined,
        districtId: form.districtId || undefined,
        districtName: form.districtName || undefined,
        cityId: form.cityId || undefined,
        cityName: form.cityName || undefined,
      };

      if (isEdit && customer) {
        await updateCustomer.mutateAsync({ id: customer.id, data: payload });
        toast.success("Customer updated successfully");
      } else {
        const { kycStatus: _, ...createPayload } = payload;
        await createCustomer.mutateAsync(createPayload);
        toast.success("Customer created successfully");
      }
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again";
      toast.error(`Failed to save customer: ${msg}`);
    }
  };

  const locationValue = {
    stateId: form.stateId ?? "",
    stateName: form.stateName ?? "",
    districtId: form.districtId ?? "",
    districtName: form.districtName ?? "",
    cityId: form.cityId ?? "",
    cityName: form.cityName ?? "",
  };

  const F = (key: keyof CustomerFormValues): string =>
    (form[key] as string) ?? "";
  const E = (key: keyof CustomerFormValues): React.ReactNode =>
    errors[key] ? <span className="field-error">{errors[key]}</span> : null;

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit Customer" : "New Customer"}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" disabled={isSaving}>
            {isSaving ? "Saving…" : isEdit ? "Update Customer" : "Create Customer"}
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit}>
        {/* ── Section: Client ID (read-only on edit) ── */}
        {isEdit && customer?.clientCode && (
          <div style={{ marginBottom: 16, padding: "6px 10px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6 }}>
            <span style={{ fontSize: 12, color: "#166534" }}>
              Client ID: <strong style={{ letterSpacing: "0.04em" }}>{customer.clientCode}</strong>
            </span>
          </div>
        )}

        {/* ── Section: Basic Info ── */}
        <SectionTitle>Basic Information</SectionTitle>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="cm-name">Full Name *</label>
            <input id="cm-name" value={F("name")} onChange={(e) => set("name", e.target.value)} placeholder="Full name" required />
            {E("name")}
          </div>

          <div className="form-group">
            <label htmlFor="cm-mobile">
              Mobile *
              {isEdit && customer?.mobileVerified && (
                <span style={{ marginLeft: 6, fontSize: 11, color: "#16a34a", fontWeight: 600 }}>✓ Verified</span>
              )}
            </label>
            <input
              id="cm-mobile"
              type="tel"
              value={F("mobile")}
              onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile"
              inputMode="numeric"
              maxLength={10}
              required
            />
            {E("mobile")}
          </div>

          <div className="form-group">
            <label htmlFor="cm-email">Email</label>
            <input id="cm-email" type="email" value={F("email")} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" />
            {E("email")}
          </div>

          <div className="form-group">
            <label htmlFor="cm-alt-mobile">Alternate Mobile</label>
            <input
              id="cm-alt-mobile"
              type="tel"
              value={F("alternateMobile")}
              onChange={(e) => set("alternateMobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit alternate number"
              inputMode="numeric"
              maxLength={10}
            />
            {E("alternateMobile")}
          </div>

          <div className="form-group">
            <label htmlFor="cm-dob">Date of Birth</label>
            <input
              id="cm-dob"
              type="date"
              value={F("dateOfBirth")}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
            {E("dateOfBirth")}
          </div>

          <div className="form-group">
            <label htmlFor="cm-source">Source</label>
            <input id="cm-source" value={F("source")} onChange={(e) => set("source", e.target.value)} placeholder="Referral, Campaign, Walk-in…" />
            {E("source")}
          </div>
        </div>

        {/* ── Section: Identity / KYC ── */}
        <SectionTitle>Identity &amp; KYC</SectionTitle>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="cm-pan">PAN Number</label>
            <input
              id="cm-pan"
              value={F("panNumber")}
              onChange={(e) => set("panNumber", e.target.value.toUpperCase().slice(0, 10))}
              placeholder="ABCDE1234F"
              maxLength={10}
              style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}
            />
            {E("panNumber")}
          </div>

          <div className="form-group">
            <label htmlFor="cm-aadhar">Aadhar Number</label>
            <input
              id="cm-aadhar"
              type="text"
              value={F("aadharNumber")}
              onChange={(e) => set("aadharNumber", e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="12-digit Aadhar"
              inputMode="numeric"
              maxLength={12}
            />
            {E("aadharNumber")}
          </div>

          {isEdit && (
            <div className="form-group">
              <label htmlFor="cm-kyc">KYC Status</label>
              <select
                id="cm-kyc"
                value={F("kycStatus")}
                onChange={(e) => set("kycStatus", e.target.value as "PENDING" | "VERIFIED" | "REJECTED")}
              >
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          )}
        </div>

        {/* ── Section: Location ── */}
        <SectionTitle>
          Location
          {pospDistrict && !isEdit && (
            <span style={{ marginLeft: 8, fontSize: 11, color: "#6366f1", fontWeight: 400 }}>
              (pre-filled from your territory)
            </span>
          )}
        </SectionTitle>
        <LocationSelector
          value={locationValue}
          onChange={(loc) =>
            setForm((prev) => ({
              ...prev,
              stateId: loc.stateId,
              stateName: loc.stateName,
              districtId: loc.districtId,
              districtName: loc.districtName,
              cityId: loc.cityId,
              cityName: loc.cityName,
            }))
          }
        />

        <div className="form-grid" style={{ marginTop: 12 }}>
          <div className="form-group full">
            <label htmlFor="cm-address">Address</label>
            <textarea
              id="cm-address"
              rows={2}
              value={F("address")}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street, area, landmark…"
            />
            {E("address")}
          </div>

          <div className="form-group">
            <label htmlFor="cm-pincode">Pincode</label>
            <input
              id="cm-pincode"
              type="text"
              value={F("pincode")}
              onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit pincode"
              inputMode="numeric"
              maxLength={6}
            />
            {E("pincode")}
          </div>
        </div>
      </form>
    </Modal>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.07em",
      textTransform: "uppercase",
      color: "#6b7280",
      borderBottom: "1px solid #f3f4f6",
      paddingBottom: 6,
      marginBottom: 12,
      marginTop: 20,
    }}>
      {children}
    </div>
  );
}
