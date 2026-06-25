/**
 * Complete insurance product taxonomy for Roinet Insurance Brokers.
 * productLine is stored on Deal/Lead; productSubType provides sub-categorization.
 */

export interface ProductSubType {
  value: string;
  label: string;
}

export interface ProductLine {
  value: string;
  label: string;
  subTypes: ProductSubType[];
}

export const INSURANCE_PRODUCTS: ProductLine[] = [
  {
    value: "HEALTH",
    label: "Health Insurance",
    subTypes: [
      { value: "INDIVIDUAL_MEDICLAIM", label: "Individual Mediclaim" },
      { value: "FAMILY_FLOATER", label: "Family Floater" },
      { value: "GROUP_MEDICLAIM", label: "Group Mediclaim (GMC)" },
      { value: "GROUP_PERSONAL_ACCIDENT", label: "Group Personal Accident (GPA)" },
      { value: "PERSONAL_ACCIDENT", label: "Personal Accident (PA)" },
      { value: "HOSPI_SHIELD_CASH", label: "Hospi Shield / Cash" },
      { value: "CRITICAL_ILLNESS", label: "Critical Illness" },
      { value: "TOP_UP", label: "Top-Up / Super Top-Up" },
      { value: "SENIOR_CITIZEN", label: "Senior Citizen" },
      { value: "MATERNITY", label: "Maternity Cover" },
    ],
  },
  {
    value: "MOTOR",
    label: "Motor Insurance",
    subTypes: [
      { value: "PRIVATE_CAR", label: "Private Car" },
      { value: "FLEET", label: "Fleet" },
      { value: "PCV", label: "PCV (Passenger Carrying Vehicle)" },
      { value: "COMMERCIAL_VEHICLE", label: "Commercial Vehicle" },
      { value: "SCHOOL_BUSES", label: "School Buses" },
      { value: "MISC_D_TRACTOR", label: "Misc-D — Tractor" },
      { value: "MISC_D_CRANES", label: "Misc-D — Cranes" },
      { value: "MISC_D_JCB_RTO", label: "Misc-D — JCB (RTO Registration)" },
      { value: "THREE_WHEELER_AUTO", label: "Three Wheeler — Auto Rickshaw" },
      { value: "THREE_WHEELER_E_RICKSHAW", label: "Three Wheeler — E-Rickshaw" },
      { value: "TWO_WHEELER", label: "Two Wheeler" },
    ],
  },
  {
    value: "LIFE",
    label: "Life Insurance",
    subTypes: [
      { value: "TERM_LIFE", label: "Term Life" },
      { value: "WHOLE_LIFE", label: "Whole Life" },
      { value: "ENDOWMENT", label: "Endowment" },
      { value: "ULIP", label: "ULIP (Unit Linked)" },
      { value: "GROUP_LIFE", label: "Group Life" },
      { value: "MONEY_BACK", label: "Money Back" },
      { value: "CHILD_PLAN", label: "Child Plan" },
      { value: "PENSION", label: "Pension / Annuity" },
    ],
  },
  {
    value: "TRAVEL",
    label: "Travel Insurance",
    subTypes: [
      { value: "DOMESTIC_TRAVEL", label: "Domestic" },
      { value: "INTERNATIONAL_TRAVEL", label: "International" },
    ],
  },
  {
    value: "COMMERCIAL_LINES",
    label: "Commercial Lines",
    subTypes: [
      { value: "ENGINEERING", label: "Engineering" },
      { value: "AVIATION", label: "Aviation" },
      { value: "CREDIT_INSURANCE", label: "Credit Insurance" },
      { value: "LIABILITY_INSURANCE", label: "Liability Insurance" },
      { value: "MARINE", label: "Marine" },
      { value: "FIRE", label: "Fire" },
      { value: "CYBER_INSURANCE", label: "Cyber Insurance" },
      { value: "PROFESSIONAL_INDEMNITY", label: "Professional Indemnity" },
    ],
  },
  {
    value: "RURAL",
    label: "Rural Insurance",
    subTypes: [
      { value: "CROP_PMFBY", label: "Crop — PM Fasal Bima Yojana" },
      { value: "CROP_WEATHER_INDEX", label: "Crop — Weather Index" },
      { value: "CROP_HORTICULTURE", label: "Crop — Horticulture" },
    ],
  },
  {
    value: "HOME",
    label: "Home Insurance",
    subTypes: [
      { value: "HOME_STRUCTURE", label: "Home Structure" },
      { value: "HOME_CONTENTS", label: "Home Contents" },
      { value: "HOME_COMPREHENSIVE", label: "Home Comprehensive" },
    ],
  },
];

/** Flat list of all product lines for a top-level dropdown */
export const PRODUCT_LINE_OPTIONS = INSURANCE_PRODUCTS.map((p) => ({
  value: p.value,
  label: p.label,
}));

/** Get sub-types for a selected product line */
export function getSubTypes(productLine: string): ProductSubType[] {
  return INSURANCE_PRODUCTS.find((p) => p.value === productLine)?.subTypes ?? [];
}

/** All sub-types as a flat list (for searching/filtering) */
export const ALL_SUB_TYPES = INSURANCE_PRODUCTS.flatMap((p) =>
  p.subTypes.map((s) => ({ ...s, productLine: p.value }))
);

/** All valid product line values */
export const ALL_PRODUCT_LINE_VALUES = INSURANCE_PRODUCTS.map((p) => p.value);

/** Indian insurance companies / insurers */
export const INSURER_OPTIONS = [
  // Life
  { value: "LIC", label: "LIC of India" },
  { value: "HDFC_LIFE", label: "HDFC Life" },
  { value: "ICICI_PRU", label: "ICICI Prudential Life" },
  { value: "MAX_LIFE", label: "Max Life Insurance" },
  { value: "SBI_LIFE", label: "SBI Life" },
  { value: "TATA_AIA", label: "Tata AIA Life" },
  { value: "BAJAJ_ALLIANZ_LIFE", label: "Bajaj Allianz Life" },
  { value: "KOTAK_LIFE", label: "Kotak Mahindra Life" },
  { value: "ADITYA_BIRLA_LIFE", label: "Aditya Birla Sun Life" },
  { value: "PNB_METLIFE", label: "PNB MetLife" },
  // Health / General
  { value: "STAR_HEALTH", label: "Star Health Insurance" },
  { value: "NIVA_BUPA", label: "Niva Bupa Health" },
  { value: "CARE_HEALTH", label: "Care Health Insurance" },
  { value: "ICICI_LOMBARD", label: "ICICI Lombard General" },
  { value: "HDFC_ERGO", label: "HDFC ERGO General" },
  { value: "BAJAJ_ALLIANZ_GEN", label: "Bajaj Allianz General" },
  { value: "NEW_INDIA", label: "New India Assurance" },
  { value: "UNITED_INDIA", label: "United India Insurance" },
  { value: "NATIONAL_INSURANCE", label: "National Insurance Co." },
  { value: "ORIENTAL_INSURANCE", label: "Oriental Insurance" },
  { value: "RELIANCE_GEN", label: "Reliance General Insurance" },
  { value: "TATA_AIG", label: "Tata AIG General" },
  { value: "CHOLAMANDALAM", label: "Cholamandalam MS General" },
  { value: "FUTURE_GENERALI", label: "Future Generali India" },
];
