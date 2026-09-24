module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Drizzle migrations import .sql files as strings (same bundle on web and native).
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
