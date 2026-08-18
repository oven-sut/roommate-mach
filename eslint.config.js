// Flat config. `eslint-config-expo` brings the React, React Hooks and React
// Native rules that match this SDK (54).
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: [
      "dist/*",
      "android/*",
      "node_modules/*",
      ".expo/*",
      "scripts/*",
      "screenshots/*",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // TypeScript already reports unused locals and parameters (see
      // `noUnusedLocals` / `noUnusedParameters` in tsconfig.json), and it does
      // so correctly. The base ESLint rule cannot read TypeScript, so it flags
      // the parameter names inside function *types* — `go: (x: Screen) => void`
      // — as unused variables. Leave the job to tsc.
      "no-unused-vars": "off",

      // This rule exists to stop raw entities breaking HTML. React Native text
      // is not HTML: an apostrophe in <Txt> renders as an apostrophe.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "jest.setup.js"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
      },
    },
  },
];
