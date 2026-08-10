import { createEslintConfig } from '@cognitex/config/eslint';
import tseslint from 'typescript-eslint';

/**
 * The shared flat config plus a TypeScript parser.
 *
 * The base rules stay as they are; the only additions are the ones that need
 * to know about types. `no-unused-vars` is handed over to its TS-aware twin
 * because the base rule cannot see type-only imports and reports every one of
 * them as dead.
 */
export default createEslintConfig({
    extend: [
        ...tseslint.configs.recommended,
        {
            files: ['**/*.{ts,tsx}'],
            rules: {
                'no-unused-vars': 'off',
                '@typescript-eslint/no-unused-vars': [
                    'error',
                    {
                        varsIgnorePattern: '^_',
                        argsIgnorePattern: '^_',
                        caughtErrorsIgnorePattern: '^_',
                    },
                ],
            },
        },
    ],
});
