const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Drizzle migrations are .sql files inlined by babel-plugin-inline-import.
config.resolver.sourceExts.push('sql');

// `npm run build:preview` (single-file page for the claude.ai preview): use sql.js's asm.js build instead of WASM.
if (process.env.PLUS_ULTRA_PREVIEW === '1') {
  const path = require('node:path');
  const preview = path.resolve(__dirname, 'src/db/sqljs.preview.ts');
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === './sqljs' && context.originModulePath.endsWith(path.join('src', 'db', 'client.web.ts'))) {
      return { type: 'sourceFile', filePath: preview };
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
