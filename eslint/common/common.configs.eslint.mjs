import globals from 'globals'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintPluginJsdoc from 'eslint-plugin-jsdoc'
import eslintPluginSecurity from 'eslint-plugin-security'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import eslintPluginJest from 'eslint-plugin-jest'
import { CommonRules } from './common.rules.eslint.mjs'

export const NestCommonConfigs =
{
    plugins: {
        prettier: eslintPluginPrettier,
        jsdoc: eslintPluginJsdoc,
        security: eslintPluginSecurity,
        unicorn: eslintPluginUnicorn,
        jest: eslintPluginJest,
    },

    files: [ '**/*.{js,mjs,cjs,ts}' ],
    languageOptions: {
        sourceType: 'commonjs',
        ecmaVersion: 2021,
        globals: {
            ...globals.browser,
            ...globals.node,
        },
    },
    rules: CommonRules,
    settings: {
        'import/extensions': [ '.js', '.cjs', '.mjs', '.ts', '.cts', '.mts' ],
    },
}
