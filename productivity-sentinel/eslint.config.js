import tseslint from 'typescript-eslint';
import { createEslintConfig } from '@cognitex/config/eslint';

/**
 * Shared config plus a TypeScript parser.
 *
 * `createEslintConfig` was written when every app was JavaScript, so it leaves
 * the default espree parser in place and cannot read a `.ts` file at all —
 * this is the first TypeScript app in the repository, so it is the first one
 * to hit that. The override belongs in `@cognitex/config` as soon as a second
 * app is migrated; it lives here for now so the foundation is not changed
 * underneath the apps still building against it.
 *
 * The base `no-unused-vars` is swapped for the typescript-eslint version,
 * which understands that an identifier used only in a type annotation is used.
 * The underscore escape hatch from the shared config is preserved exactly.
 */
export default createEslintConfig({
    extend: [
        {
            files: ['**/*.{ts,tsx}'],
            languageOptions: {
                parser: tseslint.parser,
                parserOptions: { project: false, sourceType: 'module' },
            },
            plugins: { '@typescript-eslint': tseslint.plugin },
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
                // TypeScript already proves these; the base rules only produce
                // false positives on type-level code.
                'no-undef': 'off',
                'no-redeclare': 'off',
            },
        },
    ],
});
