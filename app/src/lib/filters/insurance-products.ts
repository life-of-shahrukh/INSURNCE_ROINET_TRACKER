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
    value: "HEALTH",
    label: "Health Insurance",
    subTypes: [
      { value: "INDIVIDUAL_MEDICLAIM", label: "Individual Mediclaim" },
      { value: "FAMILY_FLOATER", label: "Family Floater" },
      { value: "CRITICAL_ILLNESS", label: "Critical Illness" },
      { value: "PERSONAL_ACCIDENT", label: "Personal Accident" },
      { value: "GROUP_HEALTH", label: "Group Health (GMC)" },
      { value: "TOP_UP", label: "Top-Up / Super Top-Up" },
      { value: "SENIOR_CITIZEN", label: "Senior Citizen" },
      { value: "MATERNITY", label: "Maternity Cover" },
    ],
  },
  {
    value: "MOTOR",
    label: "Motor Insurance",
    subTypes: [
      { value: "PRIVATE_CAR_COMP", label: "Private Car — Comprehensive" },
      { value: "PRIVATE_CAR_TP", label: "Private Car — Third Party" },
      { value: "TWO_WHEELER_COMP", label: "Two Wheeler — Comprehensive" },
      { value: "TWO_WHEELER_TP", label: "Two Wheeler — Third Party" },
      { value: "COMMERCIAL_VEHICLE", label: "Commercial Vehicle" },
      { value: "GOODS_VEHICLE", label: "Goods Carrying Vehicle" },
      { value: "PASSENGER_VEHICLE", label: "Passenger Vehicle" },
    ],
  },
  {
    value: "PROPERTY",
    label: "Property / Fire Insurance",
    subTypes: [
      { value: "HOME_INSURANCE", label: "Home Insurance" },
      { value: "FIRE_ALLIED", label: "Fire & Allied Perils" },
      { value: "BURGLARY", label: "Burglary" },
      { value: "SHOP_INSURANCE", label: "Shop / Office Insurance" },
    ],
  },
  {
    value: "MARINE",
    label: "Marine Insurance",
    subTypes: [
      { value: "MARINE_CARGO", label: "Marine Cargo" },
      { value: "MARINE_HULL", label: "Marine Hull" },
      { value: "TRANSIT", label: "Transit Insurance" },
    ],
  },
  {
    value: "TRAVEL",
    label: "Travel Insurance",
    subTypes: [
      { value: "DOMESTIC_TRAVEL", label: "Domestic Travel" },
      { value: "INTERNATIONAL_TRAVEL", label: "International Travel" },
      { value: "STUDENT_TRAVEL", label: "Student Travel Abroad" },
    ],
  },
  {
    value: "COMMERCIAL",
    label: "Commercial / Corporate",
    subTypes: [
      { value: "GROUP_TERM_LIFE", label: "Group Term Life" },
      { value: "WORKERS_COMP", label: "Workers' Compensation" },
      { value: "DIRECTORS_OFFICERS", label: "Directors & Officers" },
      { value: "PUBLIC_LIABILITY", label: "Public Liability" },
      { value: "PROFESSIONAL_INDEMNITY", label: "Professional Indemnity" },
      { value: "PRODUCT_LIABILITY", label: "Product Liability" },
    ],
  },
  {
    value: "CROP",
    label: "Crop / Agriculture Insurance",
    subTypes: [
      { value: "PM_FASAL_BIMA", label: "PM Fasal Bima Yojana" },
      { value: "WEATHER_INDEX", label: "Weather Index Insurance" },
      { value: "HORTICULTURE", label: "Horticulture Insurance" },
    ],
  },
  {
    value: "ENGINEERING",
    label: "Engineering Insurance",
    subTypes: [
      { value: "CONTRACTORS_ALL_RISK", label: "Contractor's All Risk" },
      { value: "MACHINERY_BREAKDOWN", label: "Machinery Breakdown" },
      { value: "ERECTION_ALL_RISK", label: "Erection All Risk" },
      { value: "ELECTRONIC_EQUIPMENT", label: "Electronic Equipment" },
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
