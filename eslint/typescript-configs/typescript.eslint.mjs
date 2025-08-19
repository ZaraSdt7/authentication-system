import { TypescriptIgnore } from './typescript.ignore.eslint.mjs'
import { TypescriptRules } from './typescript.rules.eslint.mjs'

export const NestTsConfigs = {
    files: [ '**/*.ts', '**/*.cts', '**/*.mts' ],
    ignores: TypescriptIgnore,
    languageOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        globals: {
            Atomics: 'readonly',
            SharedArrayBuffer: 'readonly',
        },
        parserOptions: {
            project: './tsconfig.json',
        },
    },
    rules: TypescriptRules,
}
