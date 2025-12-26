import ViteYaml from '@modyfi/vite-plugin-yaml'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv, UserConfigFnObject, type PluginOption } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import qfaceInfo from './src/renderer/src/assets/img/qq-face/public/assets/qq_emoji/_index.json' with { type: 'json' }

const isDesktop = !!process.env.DESKTOP

export function configFactory(outPath: string): UserConfigFnObject {
    return ({ mode }) => {
        const env = loadEnv(mode, process.cwd())
        const useLocalFace = env.VITE_LOCAL_FACE == 'true'

        const plugins: PluginOption[] = [
            vue(),
            vueDevTools(),
            ViteYaml(),
            !isDesktop && VitePWA({ registerType: 'autoUpdate' }),
            visualizer() as PluginOption,
        ]

        if (useLocalFace) {
            const apngList: string[] = []
            const lottieList: string[] = []
            for (const info of qfaceInfo) {
                for (const pathInfo of info.assets) {
                    if (pathInfo.type === 2)
                        apngList.push(`src/assets/img/qq-face/public/${pathInfo.path}`)

                    else if (pathInfo.type === 3)
                        lottieList.push(`src/assets/img/qq-face/public/${pathInfo.path}`)
                }
            }

            const targets: any = []
            for (const src of apngList) {
                targets.push({
                    src: src,
                    dest: 'img/qface/',
                })
            }
            for (const src of lottieList) {
                targets.push({
                    src: src,
                    dest: 'img/qface/',
                })
            }

            plugins.push(viteStaticCopy({
                targets: targets
            }))
        }

        return {
            root: './src/renderer',
            envDir: '../../',
            cacheDir: '../../.vite',
            base: process.env.BUILD_ENV == 'github-actions' ? '/Stapxs-QQ-Lite-2.0/' : './',
            server: {
                port: 8080,
                proxy: {
                    '/api': {
                        target: 'http://localhost:3000',
                        changeOrigin: true,
                        rewrite: (path) => path.replace(/^\/api/, '')
                    }
                }
            },
            plugins: plugins,
            resolve: {
                alias: {
                    '@renderer': resolve(__dirname, 'src/renderer/src'),
                    fs: 'rollup-plugin-node-polyfills/polyfills/empty',
                }
            },
            build: {
                outDir: outPath,
                emptyOutDir: true,
                chunkSizeWarningLimit: 1100,
                rollupOptions: {
                    input: { main: resolve('src/renderer/index.html') },
                    external: [resolve('src/renderer/src/assets/img/qq-face/docs')],
                    onwarn: (warning) => {
                        if (warning.code === 'CIRCULAR_DEPENDENCY') return
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
        }
    }
}

// https://vite.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig(configFactory(resolve(__dirname, 'dist')))
