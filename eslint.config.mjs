import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",
    
    // React rules
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    
    // Next.js rules
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",
    
    // General JavaScript rules
    "prefer-const": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-fallthrough": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-unreachable": "off",
    "no-useless-escape": "off",
  },
}, {
  // The editor extension is CommonJS because it has to be: VS Code loads an
  // extension's entry point with `require`, and the `vscode` module itself
  // is injected into that loader rather than resolvable from disk. So
  // `require('vscode')` is not a style choice there, it is the only way to
  // reach the API — and the one ESM import in the package (the `hoverlab`
  // catalog client, which is `"type": "module"`) is a dynamic `import()`
  // for exactly that reason. See packages/vscode/src/catalog.js.
  files: ["packages/vscode/**/*.js"],
  rules: {
    "@typescript-eslint/no-require-imports": "off",
  },
}, {
  // src/lib/templates/files is template scaffolding, not application code:
  // it is never imported, it is read as text and shipped to users, and its
  // imports resolve against *their* project rather than this one. Linting
  // it would report unresolvable paths that are correct where it lands.
  // Excluded from tsconfig for the same reason.
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", "src/lib/templates/files/**"]
}];

export default eslintConfig;
