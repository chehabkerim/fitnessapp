const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'dist-preview/*', 'design/*', 'drizzle/*', 'scripts/sw.template.js'] },
]);
