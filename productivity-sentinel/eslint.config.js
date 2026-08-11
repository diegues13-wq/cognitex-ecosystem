import { createEslintConfig } from '@cognitex/config/eslint';

/**
 * The whole lint setup, including the TypeScript parser, lives in
 * @cognitex/config. Each app previously carried a ~30-line override adding
 * that parser — written when the shared config predated any TypeScript app.
 */
export default createEslintConfig();
