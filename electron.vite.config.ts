import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

import * as viteConfig from './vite.config.ts'

export default defineConfig({
    main: {
        plugins: [
            externalizeDepsPlugin(),
            viteStaticCopy({
                targets: [
                    { src: 'src/electron/assets', dest: './' },
                ]
            })
        ],
        build: {
            lib: {
                entry: 'src/electron/index.ts',
            }
        }
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
    },
    renderer: viteConfig.configFactory('out/renderer'),
})
