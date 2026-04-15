import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node
            }
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'error',
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],

            'indent': ['error', 4],
            'no-multi-spaces': 'error',
            'comma-dangle': ['error', 'never']
        }
    },
    {
        ignores: ['node_modules/', 'neo4j-data/']
    }
];
