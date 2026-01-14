//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";

export default [
  // ESLint flat config doesn't automatically respect .gitignore
  { ignores: [".output/**", ".wrangler/**"] },
  ...tanstackConfig,
];
