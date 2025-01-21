import Store from 'electron-store'
import path from 'path'
import os from 'os'
import log4js from 'log4js'
import axios from 'axios'

import {
    ipcMain,
    shell,
    systemPreferences,
    app,
    Menu,
    MenuItemConstructorOptions,
    Notification as ELNotification,
} from 'electron'
import { linkView, runCommand } from './util.ts'
import { win, touchBarInstance } from '../index.ts'
import { Connector } from './connector.ts'
import { logLevel } from '../index.ts'
import ScanNetwork from './scannetwork.ts'

let connector = undefined as Connector | undefined
const store = new Store()
const logger = log4js.getLogger('ipc')
let template = [] as any[]

// 消息缓存，key 为 tag
const noticeList = {} as { [key: string]: ELNotification }

export function regIpcListener() {
    // 后端连接模式
    ipcMain.on('onebot:connect', (_, args) => {
        if (!connector && win) {
            connector = new Connector(win)
        }
        connector?.connect(args.address, args.token)
    })
    // 获取系统平台
    ipcMain.handle('sys:getPlatform', () => {
        return process.platform
    })
    ipcMain.handle('sys:getRelease', () => {
        return os.release()
    })
    // 本地链接预览
    ipcMain.handle('sys:previewLink', async (_, link: string) => {
        const linkList = {
            bilibili: ['bilibili.com', 'b23.tv', 'bili2233.cn', 'acg.tv'],
        }

        // 判断是不是特殊解析的链接
        for (const key in linkList) {
            if (linkList[key].some((item: string) => link.includes(item))) {
                return await linkView[key](link)
            }
        }
        // 通用解析，注意排除非 html 的请求防止下载大文件
        const res = await axios.get(link, {
            headers: { Accept: 'text/html' }
        })
        const contentType = res.headers['content-type']
        if(contentType && contentType.includes('text/html')) {
            // 获取 html
            let html = res.data
            const headEnd = html.indexOf('</head>')
            html = html.slice(0, headEnd)
            // 获取所有的 og meta 标签
            const ogRegex = /<meta\s+property="og:([^"]+)"\s+content="([^"]+)"\s*\/?>/g
            const ogTags = {} as {[key: string]: string}
            let match: string[] | null
            while ((match = ogRegex.exec(html)) !== null) {
                ogTags[`og:${match[1]}`] = match[2]
            }
            return ogTags
        }
        return null
    })
    // 代理请求 HTTP
    // ipcMain.on('sys:requestHttp', (event, args) => {
    // console.log(args)

    // const cookies = JSON.parse(args.cookies)
    // console.log(cookies)
    // const cookieStrs = Object.keys(cookies).map((key) => {
    //     return key + '=' + cookies[key]
    // })
    // console.log(cookieStrs.join('; '))
    // // 异步请求，不需要立即返回
    // axios({
    //     method: args.type,
    //     url: args.url,
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Cookie': cookieStrs.join('; '),
    //     },
    //     data: args.data
    // }).then((res) => {
    //     // res.data
    //     console.log(res.data)
    // }).catch((err) => {
    //     // err
    //     console.error(err)
    // })
    // })
    // 关闭窗口
    ipcMain.on('win:close', () => {
        if (win) win.close()
    })
    // 最小化
    ipcMain.on('win:minimize', () => {
        if (win) win.minimize()
    })
    // 最大化
    ipcMain.on('win:maximize', () => {
        if (win) win.maximize()
    })
    // 重启应用
    ipcMain.on('win:relaunch', () => {
        app.relaunch()
        app.exit()
    })
    // 置顶窗口
    ipcMain.on('win:alwaysTop', (_, args) => {
        if (win) win.setAlwaysOnTop(args)
    })
    // 获取窗口信息
    ipcMain.handle('win:getWindowInfo', () => {
        if (win) {
            const [x, y] = win.getPosition()
            const [width, height] = win.getSize()
            return {
                x: x,
                y: y,
                width: width,
                height: height,
            }
        }
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        }
    })
    // 移动窗口位置
    ipcMain.on('win:move', (_, point) => {
        if (win) {
            win.setPosition(point.x, point.y)
        }
    })
    // 保存信息
    ipcMain.on('sys:store', (_, arg) => {
        store.set(arg.key, arg.value)
    })
    ipcMain.handle('sys:getStore', (_, key) => {
        return store.get(key)
    })
    // 保存设置
    // PS：升级至 electron 27 后 cookie 已完全无法持久化，只能进行保存
    ipcMain.on('opt:saveAll', (_, arg) => {
        store.store = arg
    })
    // 获取设置
    ipcMain.on('opt:getAll', (event) => {
        event.returnValue = store.store
    })
    ipcMain.on('opt:get', (event, arg) => {
        event.returnValue = store.get(arg)
    })
    // 重置设置
    ipcMain.on('opt:clearAll', (event) => {
        store.clear()
        event.returnValue = true
    })
    // 获取补充的调试信息
    ipcMain.handle('opt:getSystemInfo', () => {
        const systemInfo = {} as { [key: string]: [string, string] }
        systemInfo.electron = ['Electron Version', process.versions.electron]
        return systemInfo
    })
    // 打开开发者工具
    ipcMain.on('win:openDevTools', () => {
        if (win) win.webContents.openDevTools()
    })
    // 下载文件
    ipcMain.on('sys:download', (_, args) => {
        const downloadPath = args.downloadPath
        const fileName = args.fileName
        const ext = path.extname(fileName)
        const filters = [{ name: '全部文件', extensions: ['*'] }]
        if (ext && ext !== '.' && ext != null) {
            const array = ext.match(/[a-zA-Z]+$/)
            if (array) {
                filters.unshift({ name: '', extensions: [array[0]] })
            }
        }
        if (win) {
            win.webContents.session.on('will-download', (_, item) => {
                item.on('updated', (_, state) => {
                    if (state === 'progressing') {
                        if (!item.isPaused()) {
                            if (win) {
                                win.webContents.send('sys:downloadBack', {
                                    lengthComputable: true,
                                    loaded: item.getReceivedBytes(),
                                    total: item.getTotalBytes(),
                                })
                                win.setProgressBar(
                                    item.getReceivedBytes() /
                                        item.getTotalBytes(),
                                )
                            }
                        }
                    }
                })
                item.on('done', (event) => {
                    win?.setProgressBar(-1)
                    const sender = (event as any).sender
                    if (sender) shell.showItemInFolder(sender.getSavePath())
                })
            })
            win.webContents.downloadURL(downloadPath)
        }
    })
    // 发送通知
    ipcMain.on('sys:sendNotice', async (_, data) => {
        logger.level = logLevel
        logger.info('创建通知：' + data.tag + ' - ' + data.body)
        // MacOS: 刷新 TouchBar
        if(touchBarInstance && data.base_type === 'msg') {
            touchBarInstance.newMessage(data)
        }

        const userId = data.tag.split('/')[0]
        const msgId = data.tag.split('/')[1]

        let showData = {
            title: data.title,
            body: data.body,
            icon: data.icon,
        } as Electron.NotificationConstructorOptions
        if (process.platform === 'darwin') {
            showData = {
                ...showData,
                replyPlaceholder: '快速回复……',
                hasReply: true,
            }
            if (data.is_important) {
                showData = {
                    ...showData,
                    sound: 'resources/tri-tone.aif',
                }
            }
        }
        if (process.platform === 'win32') {
            showData = {
                toastXml: `
                <toast launch="stapx-qq-lite:action=click" activationType="protocol">
                    <visual>
                        <binding template="ToastGeneric">
                            <image placement="appLogoOverride" hint-crop="circle" src="${(data.icon as string).replaceAll('&', '&amp;')}"/>
                            <text>${data.title}</text>
                            <text>${data.body}</text>
                        </binding>
                    </visual>
                    <actions>
                        <input id="quick" type="text" placeHolderContent="reply"/>
                        <action
                            content="▶"
                            hint-inputId="quick"
                            arguments="stapx-qq-lite:action=reply&amp;data=%quick%"
                            activationType="protocol"/>
                    </actions>
                </toast>`,
            }
        }
        if (process.platform === 'linux') {
            if (data.is_important) {
                showData = {
                    ...showData,
                    urgency: 'critical',
                }
            }
        }
        const notification = new ELNotification(showData)
        notification.show()
        // 通知事件
        notification.on('click', () => {
            win?.focus()
            win?.webContents.send('app:jumpChat', {
                userId: userId,
                msgId: msgId,
            })
        })
        notification.on('reply', (_, reply) => {
            win?.webContents.send('bot:quickReply', {
                type: data.type,
                id: userId,
                msg: msgId,
                content: reply,
            })
        })
        // 保存通知对象
        noticeList[data.tag] = notification
    })
    // 关闭通知
    ipcMain.on('sys:closeNotice', (_, tag) => {
        if(noticeList[tag]) {
            logger.level = logLevel
            logger.info('关闭通知：' + tag)
            noticeList[tag].close()
            delete noticeList[tag]
            // macOS: 刷新 TouchBar
            if(touchBarInstance) {
                touchBarInstance.removeMessage(tag)
            }
        }
    })
    // 清空通知
    ipcMain.on('sys:clearNotice', () => {
        Object.keys(noticeList).forEach((key) => {
            logger.level = logLevel
            logger.info('清空通知')
            noticeList[key].close()
            delete noticeList[key]
        })
    })
    // 关闭指定 ID 的所有通知
    ipcMain.on('sys:closeAllNotice', (_, id) => {
        Object.keys(noticeList).forEach((key) => {
            if(key.startsWith(id)) {
                logger.level = logLevel
                logger.info('关闭所有通知：' + id)
                noticeList[key].close()
                delete noticeList[key]
                // macOS: 刷新 TouchBar
                if(touchBarInstance) {
                    touchBarInstance.removeMessage(key)
                }
            }
        })
    })
    // 运行命令
    ipcMain.handle('sys:runCommand', async (_, cmd) => {
        try {
            const info = await runCommand(cmd)
            const str = info.stdout as string
            return { success: true, message: str }
        } catch (ex) {
            return { success: false, message: (ex as Error).message }
        }
    })
    // 启用服务发现
    ipcMain.on('sys:scanNetwork', () => {
        if(win)
            new ScanNetwork(win).scanNetwork()
    })

    // Windows：闪烁状态栏图标
    ipcMain.on('win:flashWindow', () => {
        if (win) win.flashFrame(true)
    })
    // Winodws：通过注册表获取系统主题色
    ipcMain.handle('sys:getWinColor', () => {
        // 订阅颜色修改事件
        systemPreferences.addListener('accent-color-changed', () => {
            if (win) {
                win.webContents.send(
                    'sys:WinColorChanged',
                    systemPreferences.getAccentColor(),
                )
            }
        })
        return systemPreferences.getAccentColor()
    })

    // Linux：获取 gnome extension 设置
    // dconf dump /org/gnome/shell/extensions/ |
    //          awk -v RS='' '/\[blur-my-shell\/applications\]/'
    ipcMain.handle('sys:getGnomeExt', async () => {
        try {
            const info = await runCommand(
                'dconf dump /org/gnome/shell/extensions/ | awk -v RS=\'\' \'/\\[blur-my-shell\\/applications\\]/\'',
            )
            const str = info.stdout as string
            const data = {} as { [key: string]: string }
            if (str && str.startsWith('[blur-my-shell/applications]')) {
                const lines = str.split('\n').slice(1)
                lines.forEach((line) => {
                    const [key, value] = line.split('=')
                    if (key != '') data[key] = value
                })
            }
            return data
        } catch (ex) {
            return (ex as Error).message
        }
    })

    // MacOS：初始化菜单
    // PS：由于本地化的存在，需要让 vue 获取到本地化信息之后再由 electron 构建
    ipcMain.on('sys:createMenu', (_, args) => {
        if (process.platform === 'darwin') {
            template = [
                {
                    label: args.title,
                    submenu: [
                        {
                            label: args.about,
                            click: () => {
                                sendMenuClick('app:about')
                            },
                        },
                        { label: args.update },
                        { type: 'separator' },
                        { label: args.hide, role: 'hide' },
                        { label: args.hideOthers, role: 'hideothers' },
                        { label: args.unhide, role: 'unhide' },
                        { type: 'separator' },
                        { label: args.quit, role: 'quit' },
                    ],
                },
                {
                    label: args.edit,
                    role: 'editMenu',
                    submenu: [
                        { label: args.undo, role: 'undo' },
                        { label: args.redo, role: 'redo' },
                        { type: 'separator' },
                        { label: args.cut, role: 'cut' },
                        { label: args.copy, role: 'copy' },
                        { label: args.paste, role: 'paste' },
                        { type: 'separator' },
                        { label: args.selectAll, role: 'selectall' },
                    ],
                },
                {
                    label: args.account,
                    submenu: [
                        { id: 'userName', label: args.login },
                        {
                            id: 'logout',
                            label: args.logout,
                            visible: false,
                            click: () => {
                                sendMenuClick('bot:logout')
                            },
                        },
                        { type: 'separator' },
                        {
                            id: 'userList',
                            label: args.userList,
                            click: () => {
                                sendMenuClick('app:changeTab', 'Friends')
                            },
                        },
                        {
                            label: args.flushUser,
                            click: () => {
                                sendMenuClick('bot:flushUser')
                            },
                        },
                    ],
                },
                {
                    label: args.help,
                    role: 'help',
                    submenu: [
                        {
                            label: args.doc,
                            click: () => {
                                sendMenuClick(
                                    'app:openLink',
                                    'https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/wiki',
                                )
                            },
                        },
                        {
                            label: args.feedback,
                            click: () => {
                                sendMenuClick(
                                    'app:openLink',
                                    'https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/issues',
                                )
                            },
                        },
                        { type: 'separator' },
                        {
                            label: args.license,
                            click: () => {
                                sendMenuClick(
                                    'app:openLink',
                                    'https://github.com/Stapxs/Stapxs-QQ-Lite-2.0/blob/master/LICENSE',
                                )
                            },
                        },
                    ],
                },
            ] as MenuItemConstructorOptions[]
            Menu.setApplicationMenu(Menu.buildFromTemplate(template))
        }
    })
    ipcMain.on('sys:updateMenu', (_, args) => {
        if (process.platform === 'darwin') {
            const id = args.id
            const action = args.action
            const value = args.value
            // 在 template 里寻找这个 id 修改对应的值
            let menuIndex = -1
            let itemIndex = -1
            for (let i = 0; i < template.length; i++) {
                const menuItem = template[i]
                if (menuItem.id == id) {
                    menuIndex = i
                    break
                }
            }
            if (menuIndex == -1) {
                for (let i = 0; i < template.length; i++) {
                    const menuItem = template[i]
                    const submenu =
                        menuItem.submenu as MenuItemConstructorOptions[]
                    if (submenu && submenu.length > 0) {
                        for (let j = 0; j < submenu.length; j++) {
                            const subMenuItem = submenu[j]
                            if (subMenuItem.id == id) {
                                menuIndex = i
                                itemIndex = j
                                break
                            }
                        }
                    }
                }
            }
            if (menuIndex > -1) {
                const item =
                    itemIndex > -1? template[menuIndex].submenu[itemIndex]: template[menuIndex]
                switch (action) {
                    case 'label':
                        item.label = value
                        break
                    case 'visible':
                        item.visible = value
                        break
                }
            }
            Menu.setApplicationMenu(Menu.buildFromTemplate(template))
        }
    })
    function sendMenuClick(name: string, value = undefined as any) {
        if (win) {
            win.focus()
            if (value) {
                win.webContents.send(name, value)
            } else {
                win.webContents.send(name)
            }
        }
    }
    // MacOS：touchBar 相关功能
    ipcMain.on('sys:flushOnMessage', (_, list) => {
        if(touchBarInstance) {
            touchBarInstance.flushOnMessage(list)
        }
    })
    ipcMain.on('sys:flushFriendSearch', (_, list) => {
        if(touchBarInstance) {
            touchBarInstance.flushFriendSearch(list)
        }
    })
}
