import { defineConfig, type PluginOption } from 'vite'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import ViteYaml from '@modyfi/vite-plugin-yaml'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig({
    root: './src/renderer',
    base: process.env.BUILD_ENV == 'github-actions'? '/Stapxs-QQ-Lite-2.0/' : "./",
    server: {
        port: 8080
    },
    plugins: [
        vue(),
        vueDevTools(),
        ViteYaml(),
        VitePWA({ registerType: 'autoUpdate' }),
        visualizer() as PluginOption
    ],
    resolve: {
        alias: {
            '@renderer': resolve(__dirname, 'src/renderer/src'),
            fs: 'rollup-plugin-node-polyfills/polyfills/empty',
        }
    },
    build: {
        outDir: resolve(__dirname, 'dist'),
        emptyOutDir: true,
        chunkSizeWarningLimit: 1100,
        rollupOptions: {
            input: { main: resolve('src/renderer/index.html') },
            external: [ resolve('src/renderer/src/assets/img/qq-face/docs') ],
            onwarn: (warning) => {
                if(warning.code === 'CIRCULAR_DEPENDENCY') return
            },
            output: {
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        // 让每个插件都打包成独立的文件
                        return id.toString().split('node_modules/')[1].split('/')[0].toString()
                    }
                }
            }
        }
    }
})
