"use client";

import { useEffect, useState } from "react";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { LocationSelector } from "@/components/location/LocationSelector";
import { customerFormSchema, type CustomerFormValues } from "@/lib/schemas";
import type { Customer } from "@/lib/api/customer-api";

interface CustomerModalProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  /** Name pre-filled (new-customer mode only) from the list search box. */
  prefillName?: string;
  /** Optional callback when customer is created/updated successfully */
  onSaved?: (customer: Customer) => void;
  /** Optional z-index for the modal overlay (default: undefined, uses CSS default) */
  zIndex?: number;
}

const emptyForm = {
  name: "",
  email: "",
  mobile: "",
  alternateMobile: "",
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
  kycStatus: "PENDING" as "PENDING" | "VERIFIED" | "REJECTED",
};

export function CustomerModal({
  open,
  customer,
  onClose,
  prefillName,
  onSaved,
  zIndex,
}: CustomerModalProps) {
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] =
    useState<Partial<Record<keyof CustomerFormValues, string>>>({});

  useEffect(() => {
    if (!open) {
      setErrors({});
      return;
    }
    setErrors({});
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        mobile: customer.mobile || "",
        alternateMobile: customer.alternateMobile || "",
        panNumber: customer.panNumber || "",
        aadharNumber: customer.aadharNumber || "",
        stateId: customer.stateId || "",
        stateName: customer.stateName || "",
        districtId: customer.districtId || "",
        districtName: customer.districtName || "",
        cityId: customer.cityId || "",
        cityName: customer.cityName || "",
        address: customer.address || "",
        pincode: customer.pincode || "",
        source: customer.source || "",
        kycStatus: customer.kycStatus || "PENDING",
      });
    } else {
      setFormData({ ...emptyForm, name: prefillName?.trim() ?? "" });
    }
  }, [customer, open, prefillName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = customerFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CustomerFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CustomerFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    
    // Clean the data: remove empty strings to avoid validation errors
    const cleanData: Record<string, string> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value !== "" && value !== null) {
        cleanData[key] = value as string;
      }
    }
    
    try {
      let savedCustomer: Customer;
      if (customer) {
        savedCustomer = await updateCustomer.mutateAsync({ id: customer.id, data: cleanData as never });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { kycStatus, ...createPayload } = cleanData;
        savedCustomer = await createCustomer.mutateAsync(createPayload as never);
      }
      onSaved?.(savedCustomer);
      onClose();
    } catch (error) {
      console.error("Failed to save customer:", error);
      alert("Failed to save customer");
    }
  };

  const handleLocationChange = (location: {
    stateId: string | null;
    stateName: string | null;
    districtId: string | null;
    districtName: string | null;
    cityId: string | null;
    cityName: string | null;
  }) => {
    setFormData((prev) => ({
      ...prev,
      stateId: location.stateId || "",
      stateName: location.stateName || "",
      districtId: location.districtId || "",
      districtName: location.districtName || "",
      cityId: location.cityId || "",
      cityName: location.cityName || "",
    }));
  };

  if (!open) return null;

  return (
    <div 
      className="modal-overlay show" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={zIndex ? { zIndex } : undefined}
    >
      <div className="modal modal--wide" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="modal-title">{customer ? "Edit Customer" : "New Customer"}</div>
          <button type="button" onClick={onClose} className="close-btn" aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <form id="customer-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                {errors.name && (
                  <span className="field-error">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile *</label>
                <input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                />
                {errors.mobile && (
                  <span className="field-error">{errors.mobile}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                {errors.email && (
                  <span className="field-error">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="alternateMobile">Alternate Mobile</label>
                <input
                  id="alternateMobile"
                  type="tel"
                  value={formData.alternateMobile}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alternateMobile: e.target.value,
                    })
                  }
                />
                {errors.alternateMobile && (
                  <span className="field-error">{errors.alternateMobile}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="panNumber">PAN Number</label>
                <input
                  id="panNumber"
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      panNumber: e.target.value.toUpperCase(),
                    })
                  }
                  maxLength={10}
                />
                {errors.panNumber && (
                  <span className="field-error">{errors.panNumber}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="aadharNumber">Aadhar Number</label>
                <input
                  id="aadharNumber"
                  type="text"
                  value={formData.aadharNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, aadharNumber: e.target.value })
                  }
                  maxLength={12}
                />
                {errors.aadharNumber && (
                  <span className="field-error">{errors.aadharNumber}</span>
                )}
              </div>

              {customer && (
                <div className="form-group">
                  <label htmlFor="kycStatus">KYC Status</label>
                  <select
                    id="kycStatus"
                    value={formData.kycStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kycStatus: e.target.value as
                          | "PENDING"
                          | "VERIFIED"
                          | "REJECTED",
                      })
                    }
                  >
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="source">Source</label>
                <input
                  id="source"
                  type="text"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  placeholder="e.g., Referral, Campaign"
                />
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <h3 style={{ marginBottom: "10px", fontSize: "14px", fontWeight: 600 }}>
                Location
              </h3>
              <LocationSelector 
                onLocationChange={handleLocationChange}
                initialStateId={formData.stateId || null}
                initialDistrictId={formData.districtId || null}
                initialCityId={formData.cityId || null}
              />
            </div>

            <div className="form-group" style={{ marginTop: "20px" }}>
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pincode">Pincode</label>
              <input
                id="pincode"
                type="text"
                value={formData.pincode}
                onChange={(e) =>
                  setFormData({ ...formData, pincode: e.target.value })
                }
                maxLength={6}
              />
              {errors.pincode && (
                <span className="field-error">{errors.pincode}</span>
              )}
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            form="customer-form"
            className="btn-primary"
            disabled={createCustomer.isPending || updateCustomer.isPending}
          >
            {createCustomer.isPending || updateCustomer.isPending
              ? "Saving..."
              : customer
                ? "Update"
                : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
