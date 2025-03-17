// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['eslint-config-expo'],
  rules: {
    // Disable rules for unused variables in development
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    // Fix rules-of-hooks errors
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // Fix array type syntax
    '@typescript-eslint/array-type': ['error', { default: 'array' }],
    // Fix empty interface errors
    '@typescript-eslint/no-empty-interface': 'warn',
    '@typescript-eslint/no-empty-object-type': 'warn',
    // Fix import errors
    'import/no-unresolved': 'off',
    'import/first': 'warn',
    // Fix Jest errors in test files
    'no-undef': ['error', { 'typeof': true }],
    // Fix React JSX errors
    'react/jsx-no-undef': 'error',
    // Fix redeclaration errors
    '@typescript-eslint/no-redeclare': 'warn',
    // Disable no-redeclare for jest globals
    'no-redeclare': 'off'
  },
  env: {
    'jest': true,
    'node': true,
    'browser': true
  },
  globals: {
    'jest': 'readonly',
    'React': 'readonly',
    'NodeJS': 'readonly',
    'WebSocket': 'readonly',
    'Session': 'readonly',
    'ServerEvent': 'readonly'
  }
};
