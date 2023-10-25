module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    semi: ['error', 'never'],
    'prettier/prettier': [
      'error',
      {
        semi: false, // Disable semicolons
        singleQuote: true, // Use single quotes (based on your provided code style)
        trailingComma: 'all', // Add trailing commas where possible
      },
    ],
  },
}
