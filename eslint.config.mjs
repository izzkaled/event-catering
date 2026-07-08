import nextPlugin from '@next/eslint-plugin-next'

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'campaignhub-pro/**', 'dist/**', 'build/**'],
  },
  nextPlugin.configs['core-web-vitals'],
]

