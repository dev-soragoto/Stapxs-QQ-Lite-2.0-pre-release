import { defineConfig, type PluginOption } from 'vite';
import nodeResolve from '@rollup/plugin-node-resolve';
import { builtinModules } from 'module';

const nodeModules = [...builtinModules, builtinModules.map(m => `node:${m}`)].flat();

export default defineConfig({
  resolve: { conditions: ['node', 'default'] },
  build: {
    sourcemap: false,
    target: 'esnext',
    minify: false,
    lib: { entry: 'index.ts', formats: ['es'], fileName: () => 'index.mjs' },
    rollupOptions: { external: [...nodeModules] }
  },
  plugins: [nodeResolve() as PluginOption]
});
