import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Import boundaries (see docs/frontend-architecture.md).
const boundaries = [
  { group: ["@/app/*"], message: "Do not import from routes; move shared code to features, components or lib." },
  { group: ["@/features/*/*"], message: "Import a feature through its entry point, not its internals." },
];
// Feature folders that hold booking or guest data. Matched as "@/features/x"
// and as relative paths ("../x", "../../x") so neither import style slips through.
const guestAndBookingFeatures = ["reservations", "guests", "calendar", "enquiries", "payments", "refund-log", "check-in", "traveller", "booking-engine"];
const guestAndBookingData = guestAndBookingFeatures.flatMap((name) => [`@/features/${name}`, `@/features/${name}/**`, `**/features/${name}`, `**/features/${name}/**`, `../${name}`, `../${name}/**`, `../../${name}`, `../../${name}/**`]);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: boundaries }] },
  },
  {
    // Platform Admin must not read bookings or guests.
    files: ["src/app/admin/**", "src/features/platform-admin/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...boundaries,
            { group: guestAndBookingData, message: "Platform Admin must not access booking or guest data." },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Playwright output.
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
