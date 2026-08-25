import tsParser from "@typescript-eslint/parser"

export default [
  {
    // Note the glob must tolerate the actual directory name, which contains a
    // space: "kbi_technician_app (2)". A bare "kbi_technician_app/**" misses it
    // and ESLint then walks the whole Flutter build output.
    ignores: ["node_modules/**", ".next/**", "build/**", "dist/**", "mobile/**", "kbi_technician_app*/**", "apps/**", "functions/**", "lib/generated/**", "public/admin-sw.js"]
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-console": ["warn", { "allow": ["warn", "error"] }]
    }
  },
  {
    files: ["scripts/**/*.js"],
    rules: {
      "no-console": "off"
    }
  }
]
