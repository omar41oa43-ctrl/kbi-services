const js = require("@eslint/js")
const tsParser = require("@typescript-eslint/parser")
const tsPlugin = require("@typescript-eslint/eslint-plugin")

module.exports = [
  { ignores: ["lib/**"] },
  {
    files: ["eslint.config.js"],
    languageOptions: {
      globals: { require: "readonly", module: "readonly" },
    },
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tsParser,
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
]
