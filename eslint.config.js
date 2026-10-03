import js from '@eslint/js';
import globals from 'globals';

/**
 * Flat ESLint config.
 *
 * The shipped application runs in the browser; the test runner runs in Node.
 * Both are plain ES modules, so no bundler or plugin is required.
 */
export default [
  { ignores: ['node_modules/**', 'package-lock.json'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser }
    }
  },
  {
    files: ['tests/**/*.js', 'tests/**/*.mjs', '*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node }
    }
  },
  {
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      // "== null" is the intentional null-or-undefined check.
      eqeqeq: ['error', 'smart'],
      // Empty catch blocks are deliberate (optional localStorage, clipboard fallback).
      'no-empty': ['error', { allowEmptyCatch: true }],
      // A non-breaking space inside a normalisation RegExp is intentional.
      'no-irregular-whitespace': ['error', { skipRegExps: true }],
      'no-var': 'error',
      'prefer-const': 'warn'
    }
  }
];
