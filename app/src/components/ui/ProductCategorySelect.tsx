"use client";

import { useMemo } from "react";
import {
  INSURANCE_PRODUCTS,
  getSubTypes,
  type ProductSubType,
} from "@/lib/filters/insurance-products";

interface ProductCategorySelectProps {
  productLine: string;
  productSubType?: string;
  onProductLineChange: (value: string) => void;
  onSubTypeChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

export function ProductCategorySelect({
  productLine,
  productSubType,
  onProductLineChange,
  onSubTypeChange,
  required,
  error,
}: ProductCategorySelectProps): React.ReactElement {
  const subTypes: ProductSubType[] = useMemo(
    () => getSubTypes(productLine),
    [productLine],
  );

  const handleLineChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const newLine = e.target.value;
    onProductLineChange(newLine);
    const newSubs = getSubTypes(newLine);
    onSubTypeChange(newSubs.length > 0 ? newSubs[0].value : "");
  };

  return (
    <>
      <div className="form-group">
        <label htmlFor="pcs-product-line">Product Category {required && "*"}</label>
        <select
          id="pcs-product-line"
          required={required}
          value={productLine}
          onChange={handleLineChange}
        >
          <option value="" disabled>
            Select category…
          </option>
          {INSURANCE_PRODUCTS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {error && <span className="field-error">{error}</span>}
      </div>

      {subTypes.length > 0 && (
        <div className="form-group">
          <label htmlFor="pcs-sub-type">Sub-Type</label>
          <select
            id="pcs-sub-type"
            value={productSubType || ""}
            onChange={(e) => onSubTypeChange(e.target.value)}
          >
            <option value="">— Select sub-type —</option>
            {subTypes.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
