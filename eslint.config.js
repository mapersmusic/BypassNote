// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // `dist/` est produit par `expo export`, `.expo/` par le routeur et
    // `src-tauri/` par Rust : rien de tout cela n'est du code à relire.
    ignores: ["dist/*", ".expo/*", "src-tauri/*"],
  },
]);
