import type { CapacitorConfig } from '@capacitor/cli'
import { resolve } from 'path'

const config: CapacitorConfig = {
    appId: 'cn.stapxs.webqq',
    appName: 'Stapxs QQ Lite',
    webDir: 'dist',
    loggingBehavior: 'none',
    // server: {
    //     url: 'http://192.168.0.99:8081'
    // },
    ios: {
        path: 'src/mobile/ios'
    },
    android: {
        path: 'src/mobile/android',
        buildOptions: {
            keystorePath: resolve(__dirname, 'src/mobile/_signing/ssteam'),
            keystoreAlias: 'key-ssteam',
            keystorePassword: process.env.KEYSTORE_PASSWORD || '',
            keystoreAliasPassword: process.env.KEYSTORE_ALIAS_PASSWORD || '',
            releaseType: 'APK'
        }
    }
}

export default config
