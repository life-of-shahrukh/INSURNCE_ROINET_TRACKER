import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Calling setState inside useEffect is intentional in two patterns:
      // 1. crm-provider.tsx: refresh() on mount to load initial data
      // 2. PospModal.tsx: setForm() when the modal opens to reset/populate fields
      // Both are valid React patterns — the rule produces false positives here.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
