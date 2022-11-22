module.exports = {
  root: true,
  env: {
    node: true
  },
  parser: 'vue-eslint-parser',
  extends: ['plugin:vue/vue3-recommended', 'standard-with-typescript'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true
    },
    extraFileExtensions: ['.vue']
  },
  globals: {
    wx: 'writable'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-control-regex': 0,
    'no-self-compare': 0,
    'space-infix-ops': 0,
    'vue/multi-word-component-names': 0,
    'vue/no-deprecated-slot-attribute': 0,
    'vue/no-deprecated-dollar-listeners-api': 0,
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 0,
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off'
  }
}
