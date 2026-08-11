import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

/**
 * Shared flat ESLint config.
 *
 * One rule here is deliberately stricter than what the apps used to run.
 * Their `no-unused-vars` carried `varsIgnorePattern: '^[A-Z_]|motion'`, which
 * exempts every capitalised identifier — that is why a dozen unused icon
 * imports and whole unreachable components passed lint for months. Components
 * are still exempt when *assigned* (JSX use is not seen by the base rule),
 * but unused imports are now reported.
 */
export function createEslintConfig({ extend = [] } = {}) {
    return [
        { ignores: ['dist/**', 'build/**', 'coverage/**', 'node_modules/**'] },

        js.configs.recommended,

        // TypeScript parsing. Without this, espree cannot read a .tsx file at
        // all — every type annotation is a parse error. The apps are being
        // rewritten in TypeScript, so this belongs here rather than being
        // re-added through `extend` in each of the six.
        ...tseslint.configs.recommended,

        {
            files: ['**/*.{js,jsx,ts,tsx}'],
            languageOptions: {
                ecmaVersion: 2023,
                globals: { ...globals.browser, ...globals.node },
                parserOptions: {
                    ecmaVersion: 'latest',
                    ecmaFeatures: { jsx: true },
                    sourceType: 'module',
                },
            },
            plugins: {
                'react-hooks': reactHooks,
                'react-refresh': reactRefresh,
            },
            rules: {
                ...reactHooks.configs.recommended.rules,
                'react-refresh/only-export-components': [
                    'warn',
                    { allowConstantExport: true },
                ],
                // The base rule flags every type-only import, so the
                // TypeScript-aware twin owns this check.
                'no-unused-vars': 'off',
                '@typescript-eslint/no-unused-vars': [
                    'error',
                    {
                        // Underscore prefix is the escape hatch, not "starts
                        // with a capital letter" — which is what the apps used
                        // to do, and why unused imports and whole unreachable
                        // components passed lint for months.
                        varsIgnorePattern: '^_',
                        argsIgnorePattern: '^_',
                        caughtErrorsIgnorePattern: '^_',
                    },
                ],
                'no-console': ['warn', { allow: ['warn', 'error'] }],
                eqeqeq: ['error', 'smart'],
            },
        },

        // TypeScript proves these itself; the base rules only produce false
        // positives on type-level code — a type-only import reads as an
        // undefined variable, an overload signature as a redeclaration.
        {
            files: ['**/*.{ts,tsx}'],
            rules: {
                'no-undef': 'off',
                'no-redeclare': 'off',
            },
        },

        // Tests and config files run in Node and may log freely.
        {
            files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.config.{js,ts}'],
            rules: { 'no-console': 'off' },
        },

        ...extend,
    ];
}
