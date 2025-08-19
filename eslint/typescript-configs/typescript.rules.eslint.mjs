export const TypescriptRules =
{
    // "@typescript-eslint/no-unused-vars": "off",
    '@typescript-eslint/no-unused-vars': [
        'error',
        { args: 'after-used', vars: 'all', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-floating-promises': [
        'error',
        { ignoreVoid: true, ignoreIIFE: false },
    ],
    '@typescript-eslint/naming-convention': [
        'error',
        {
            selector: 'default',
            format: null,
        },
        {
            selector: 'variable',
            format: [ 'camelCase', 'PascalCase', 'UPPER_CASE' ],
            types: [ 'boolean' ],
            prefix: [ 'is', 'should', 'has', 'can', 'did', 'will' ],
        },
        {
            selector: 'variableLike',
            format: [ 'camelCase', 'UPPER_CASE', 'PascalCase' ],
            leadingUnderscore: 'allow',
        },
        {
            selector: 'parameter',
            format: [ 'camelCase' ],
            leadingUnderscore: 'allow',
        },
        {
            selector: 'memberLike',
            modifiers: [ 'private' ],
            format: [ 'camelCase' ],
            leadingUnderscore: 'allow',
        },
        {
            selector: 'typeLike',
            format: [ 'PascalCase' ],
        },
        {
            selector: 'property',
            modifiers: [ 'readonly' ],
            format: [ 'camelCase', 'UPPER_CASE' ],
        },
        {
            selector: 'enumMember',
            format: [ 'PascalCase' ],
        },
    ],
}
