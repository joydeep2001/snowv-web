import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/lib/index.js',
      name: 'SnowV',
      fileName: 'index',
      formats: ['es']
    }
  },
  assetsInclude: ['**/*.wasm']
});
