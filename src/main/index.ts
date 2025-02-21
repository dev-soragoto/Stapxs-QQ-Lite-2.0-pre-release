import path from 'path'
import Store from 'electron-store'
import fs from 'fs'

import windowStateKeeper from 'electron-window-state'
import packageInfo from '../../package.json' assert { type: 'json' }
import { regIpcListener } from './function/ipc.ts'
import { Menu, session, app, protocol, BrowserWindow } from 'electron'
import { touchBar } from './function/touchbar.ts'
import log4js from 'log4js'
import { join } from 'path'

const isDevelopment = process.env.NODE_ENV !== 'production'
const isPrimary = app.requestSingleInstanceLock()
const logger = log4js.getLogger('background')
export let logLevel = isDevelopment ? 'debug' : 'info'

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true } }
])

export let win = undefined as BrowserWindow | undefined
export let touchBarInstance = undefined as touchBar | undefined
const isDev = import.meta.env.DEV

async function createWindow() {
    if(new Store().get('opt_log_level')) {
        logLevel = (new Store().get('opt_log_level') ?? 'info') as string
    }
    logger.level = logLevel

    /* eslint-disable no-console */
    console.log('')
    console.log(' _____ _____ _____ _____ __ __  \n' +
                '|   __|_   _|  _  |  _  |  |  | \n' +
                '|__   | | | |     |   __|-   -| \n' +
                '|_____| |_| |__|__|__|  |__|__| CopyRight © Stapx Steve')
    console.log('=======================================================')
    console.log('日志等级:', logLevel)
    /* eslint-enable no-console */
    logger.info('欢迎使用 Stapxs QQ Lite, 当前版本: ' + packageInfo.version)

    logger.info('启动平台架构：' + process.platform)
    logger.info('正在创建窗体 ……')
    Menu.setApplicationMenu(null)
    // 创建窗口
    const mainWindowState = windowStateKeeper({
        defaultWidth: 850,
        defaultHeight: 530
    })
    const store = new Store()
    let windowConfig = {
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 350,
        minHeight: 450,
        icon: path.join(__dirname,'/public/img/icons/icon.png'),
        webPreferences: {
            preload: join(__dirname, '../preload/index.mjs'),
            sandbox: false
        },
        maximizable: false,
        fullscreen: false
    } as Electron.BrowserWindowConstructorOptions
    if(process.platform === 'darwin') {
        // macOS
        windowConfig = {
            ...windowConfig,
            titleBarStyle: 'hidden',
            trafficLightPosition: { x: 11, y: 10 },
            vibrancy: 'fullscreen-ui',
            transparent: true,
            visualEffectState: 'followWindow'
        }
    } else if(process.platform === 'win32') {
        // Windows
        windowConfig = {
            ...windowConfig,
            backgroundColor: '#00000000',
            backgroundMaterial: 'acrylic',
            frame: false
        }
        store.set('opt_no_window', 'true')
    } else if(process.platform === 'linux') {
        // Linux
        windowConfig = {
            ...windowConfig,
            transparent: true,
            frame: false
        }
        store.set('opt_no_window', 'true')
    }
    win = new BrowserWindow(windowConfig)
    win.once('focus', () => {if(win)win.flashFrame(false)})
    mainWindowState.manage(win)     // 窗口状态管理器
    logger.info('创建窗体完成')
    // 注册 IPC 事务
    regIpcListener()
    // macOS：创建 TouchBar
    touchBarInstance = new touchBar(win)
    // 加载应用
    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(process.env['ELECTRON_RENDERER_URL'])
        // 打开开发者工具
        win.webContents.openDevTools()
    } else {
        win.loadURL('app://./index.html')
    }

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        if (details.responseHeaders) {
            const imageAddress = [
                'https://gchat.qpic.cn/gchatpic_new',
                'https://multimedia.nt.qq.com.cn/download'
            ]
            const ignoreAddress = [
                'devtools://',
                'chrome-extension://',
                'https://registry.npmjs.org',
                // 本地开发地址
                'http://localhost:8080',
                'http://127.0.0.1:8080',
                'http://localhost:8081',
                'http://127.0.0.1:8081'
            ]
            if(imageAddress.some((address) =>
                details.url.startsWith(address))) {
                // 不缓存图片
                details.responseHeaders['cache-control'] = ['max-age=300']
                const contentType = details.responseHeaders['content-type']
                if(contentType && contentType[0]) {
                    const typeName = contentType[0].split('/')[1]
                    // 添加文件名方便下载
                    details.responseHeaders['content-disposition'] = ['inline; filename="image.' + typeName + '"']
                }
            } else if (!ignoreAddress.some((address) =>
                details.url.startsWith(address))) {
                // 绕过 CSP 限制，X-Frame-Options 限制
                details.responseHeaders['content-security-policy'] = ['*']
                delete details.responseHeaders['x-frame-options']
                // 修改缓存时间
                if(details.url.indexOf('qlogo.cn') !== -1) {
                    // QQ 头像 URL 默认有 2592000（30 天）的缓存时间，这里修改为 3 天
                    details.responseHeaders['cache-control'] = ['max-age=259200']
                }
            }
        }
        callback({ cancel: false, responseHeaders: details.responseHeaders })
    })
}

app.on('open-url', (_, url) => {
    sendUrlToWindow(url)
})
app.on('second-instance', (_, cmd, workingDirectory) => {
    sendUrlToWindow(workingDirectory, cmd)
})
function sendUrlToWindow(url: string ,args: string[] = []) {
    win?.webContents.send('sys:handleUri', {
        url: url,
        args: args
    })
}

app.on('window-all-closed', () => {
    if (process.platform === 'win32')
    {
        app.removeAsDefaultProtocolClient('stapx-qq-lite')   // 取消默认协议
    }
    app.quit()
})

app.on('ready', async () => {
    // 单例模式
    if (!isPrimary) {
        app.quit()
        return
    }
    if (process.platform === 'win32')
    {
        app.setAppUserModelId('Stapx QQ Lite')              // 设置应用 ID
        app.setAsDefaultProtocolClient('stapx-qq-lite')     // 设置为默认协议
    }
    // 注册 customFileProtocol 到 app 协议
    protocol.handle('app', async (request) => {
        const url = request.url.replace('app://', ''); // 移除协议部分
        // 实际路径在 __dirname 的上一层的 renderer 目录下
        // PS：为了防止报错堆栈输出过多的路径信息，在这里添加了 renderer 目录
        const filePath = path.join(__dirname, '..', 'renderer', url);

        // 确认文件存在并返回内容
        try {
            const fileContent = await fs.promises.readFile(filePath);
            return new Response(fileContent, {
                headers: { 'Content-Type': getMimeType(filePath) },
            });
        } catch (err) {
            logger.error(`Failed to load file: ${filePath}`, err)
            return new Response('File not found', { status: 404 });
        }
    })
    createWindow()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

// ================================

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}
