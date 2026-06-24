"use client";

import { CustomerModal } from "./CustomerModal";
import type { Customer } from "@/lib/api/customer-api";

interface QuickAddCustomerModalProps {
  open: boolean;
  /** Name pre-filled from what the user already typed in the search box. */
  prefillName: string;
  onClose: () => void;
  /**
   * Called after the customer is successfully created.
   * `policyType` is the Insurance Interest the user selected — the caller
   * should use it to pre-fill the deal's Policy Type field.
   */
  onCreated: (customer: Customer, policyType: string) => void;
}

/**
 * QuickAddCustomerModal now uses the full CustomerModal for consistency.
 * This ensures all customer fields (Aadhar, PAN, Address, Location, etc.) 
 * are available when adding customers from the Lead/Deal modal.
 * 
 * Note: The "Insurance Interest" / Policy Type feature has been removed
 * since CustomerModal doesn't handle it. The parent (DealModal) should 
 * manage policy type selection separately.
 */
export function QuickAddCustomerModal({
  open,
  prefillName,
  onClose,
  onCreated,
}: QuickAddCustomerModalProps): React.ReactElement | null {
  
  const handleCustomerSaved = (customer: Customer) => {
    // Call the parent's onCreated callback
    // For now, we pass an empty string for policyType since CustomerModal doesn't capture it
    // The DealModal should default to "Life" or let user select
    onCreated(customer, "Life");
  };

  return (
    <CustomerModal
      open={open}
      customer={null}
      prefillName={prefillName}
      onClose={onClose}
      onSaved={handleCustomerSaved}
      zIndex={1100}
    />
  );
}
