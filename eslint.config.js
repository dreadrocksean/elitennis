// Flat config — code-quality rules live here; formatting is owned by Prettier.
// `prettierConfig` (eslint-config-prettier) is last so it disables any ESLint
// rule that would conflict with Prettier (e.g. `semi`), keeping the two aligned.
// Expand with js.configs.recommended + globals later if you want fuller linting.
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'functions/node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      semi: ['error', 'always'],
    },
  },
  prettierConfig,
];
