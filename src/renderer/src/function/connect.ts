/*
 * @FileDescription: Websocket 底层模块
 * @Author: Stapxs
 * @Date: 2022/10/20
 * @Version: 1.0
 * @Description: 此模块主要处理 Websocket 交互相关功能
 */

import Option from './option'
import app from '@renderer/main'

import { reactive } from 'vue'
import { LogType, Logger, PopType, PopInfo } from './base'
import { parse, runtimeData } from './msg'

import { BotActionElem, LoginCacheElem } from './elements/system'
import { updateMenu } from '@renderer/function/utils/appUtil'
import { callBackend } from './utils/systemUtil'

const logger = new Logger()
const popInfo = new PopInfo()

let retry = 0

export let websocket: WebSocket | undefined = undefined

export class Connector {
    /**
     * 创建 Websocket 连接
     * @param address 地址
     * @param token 密钥
     */
    static create(
        address: string,
        token?: string,
        wss: boolean | undefined = undefined,
    ) {
        const { $t } = app.config.globalProperties
        login.creating = true

        logger.add(LogType.WS, '当前处于 ALL 日志模式。连接器将输出全部收发消息 ……')

        // Electron 默认使用后端连接模式
        if (runtimeData.tags.clientType != 'web') {
            logger.add(LogType.WS, '使用后端连接模式')
            callBackend('Onebot', 'onebot:connect', false,
                ['electron', 'tauri'].includes(runtimeData.tags.clientType) ?  { address: address, token: token, } : { url: `${address}?access_token=${token}` })
            return
        }

        if(import.meta.env.VITE_APP_SSE_MODE == 'true') {
            if(import.meta.env.VITE_APP_SSE_SUPPORT == 'false') {
                // 如果 Bot 不支持 SSE 连接，直接跳过触发连接完成的后续操作
                // PS：在未连接 SSE 的情况下，ssqq 将会缺失一些功能：
                // - 新的消息推送、通知推送
                // - 聊天面板新消息将不会自动更新，但依旧可以通过重新加载面板来获取新消息
                this.onopen(address, token)
                return
            }
            logger.add(LogType.WS, '使用 SSE 连接模式')
            const sse = new EventSource(`${import.meta.env.VITE_APP_SSE_EVENT_ADDRESS}?access_token=${token}`)
            sse.onopen = () => {
                login.creating = false
                this.onopen(address, token)
            }
            sse.onmessage = (e) => {
                this.onmessage(e.data)
            }
            sse.onerror = () => {
                login.creating = false
                popInfo.add(PopType.ERR, $t('连接不稳定'))
                return
            }
            return
        } else {
            // PS：只有在未设定 wss 类型的情况下才认为是首次连接
            if (wss == undefined) {
                retry = 0
            } else {
                retry++
            }
            // 最多自动重试连接五次
            if (retry > 5) {
                login.creating = false
                return
            }

            let url = `ws://${address}?access_token=${token}`
            if (address.startsWith('ws://') || address.startsWith('wss://')) {
                url = `${address}?access_token=${token}`
            } else if (wss == undefined) {
                // 判断连接类型
                if (document.location.protocol == 'https:') {
                    // 判断连接 URL 的协议，https 优先尝试 wss
                    runtimeData.tags.connectSsl = true
                    url = `wss://${address}?access_token=${token}`
                }
            } else {
                url = `wss://${address}?access_token=${token}`
            }

            if (!websocket) {
                websocket = new WebSocket(url)
            }

            websocket.onopen = () => {
                login.creating = false
                this.onopen(address, token)
            }
            websocket.onmessage = (e) => {
                this.onmessage(e.data)
            }
            websocket.onclose = (e) => {
                login.creating = false
                this.onclose(e.code, e.reason, address, token)
            }
            websocket.onerror = (e) => {
                login.creating = false
                if (e instanceof ErrorEvent) {
                    popInfo.add(PopType.ERR, $t('连接失败') + ': ' + e.message)
                } else {
                    popInfo.add(PopType.ERR, $t('连接失败') + ': ' + $t('未知错误'))
                }
            }
        }
    }

    // 连接事件 =====================================================

    static onopen(address: string, token: string | undefined) {
        logger.add(LogType.WS, '连接成功')
        // 保存登录信息
        Option.save('address', address)
        // 保存密钥
        if (
            runtimeData.sysConfig.save_password &&
            runtimeData.sysConfig.save_password != ''
        ) {
            Option.save('save_password', token)
        }
        // 清空应用通知
        popInfo.clear()
        // 加载初始化数据
        // PS：标记登陆成功在获取用户信息的回调位置，防止无法获取到内容
        Connector.send('get_version_info', {}, 'getVersionInfo')
        // 更新菜单
        updateMenu({
            parent: 'account',
            id: 'logout',
            action: 'visible',
            value: 'true',
        })
    }

    static onmessage(message: string) {
        parse(message)
    }

    static onclose(
        code: number,
        msg: string | undefined,
        address: string,
        token: string | undefined,
    ) {
        const { $t } = app.config.globalProperties

        websocket = undefined
        updateMenu({ parent: 'account', id: 'logout', action: 'visible', value: 'false' })
        updateMenu({ parent: 'account', id: 'userName', action: 'label', value: $t('连接') })

        switch (Number(code)) {
            case 1000:
                popInfo.add(PopType.INFO, $t('连接已断开') + (msg ? (': ' + msg.replace(':', ' - ')) : ''), false)
                break // 正常关闭
            case 1006: {
                // 非正常关闭，尝试重连
                popInfo.add(PopType.ERR, $t('连接失败') + ': ' + $t('连接异常关闭'), false)
                if (login.status) {
                    this.create(address, token, undefined)
                } else {
                    // PS：由于创建连接失败也会触发此事件，所以需要判断是否已经登录
                    // 尝试使用 ws 连接
                    this.create(address, token, false)
                }
                break
            }
            case 1015: {
                // TLS 错误，尝试使用 ws 连接
                popInfo.add(PopType.ERR, $t('连接失败') + ': ' + $t('TLS错误'), false)
                this.create(address, token, false)
                break
            }
            default: {
                login.creating = false
                popInfo.add(PopType.ERR, $t('连接失败') + ': ' + $t('未知的错误 {code}',{ code: code }), false)
            }
        }

        logger.error(null, $t('连接失败') + ': ' + code)
        login.creating = false
        login.status = false
    }

    // 连接器操作 =====================================================

    /**
     * 正常断开 Websocket 连接
     */
    static close() {
        if(runtimeData.tags.clientType != 'web') {
            callBackend('Onebot', 'onebot:close', false)
        } else {
            popInfo.add(
                PopType.INFO,
                app.config.globalProperties.$t('正在断开链接……'),
            )
            if (websocket) websocket.close(1000)
        }
    }

    /**
     * 发送 Websocket 消息
     * @param name 事件名
     * @param value 参数
     * @param echo 回调名
     */
    static send(
        name: string,
        value: { [key: string]: any },
        echo: string = name,
    ) {
        if(import.meta.env.VITE_APP_SSE_MODE == 'true') {
            // 使用 http POST 请求 /api/$name,body 为 json
            const body = JSON.stringify(value)
            fetch(`${import.meta.env.VITE_APP_SSE_HTTP_ADDRESS}/${name}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': login.token,
                },
                body: body,
            }).then((response) => {
                if (response.ok) {
                    response.json().then((data) => {
                        data.echo = echo
                        parse(JSON.stringify(data))
                    })
                }
            }).catch((error) => {
                logger.error(error, ' 请求 API ' + name + ' 失败')
            })
        } else {
            // 构建 JSON
            const json = JSON.stringify({
                action: name,
                params: value,
                echo: echo,
            } as BotActionElem)
            this.sendRaw(json)
        }
    }
    static sendRaw(json: string) {
        // 发送
        if(runtimeData.tags.clientType != 'web') {
            callBackend('Onebot', 'onebot:send', false, json)
        } else if (websocket) {
            websocket.send(json)
        }

        if (Option.get('log_level') === 'debug') {
            logger.add(LogType.DEBUG, 'PUT：', JSON.parse(json))
        } else {
            logger.add(LogType.WS, 'PUT：', JSON.parse(json))
        }
    }
}

export const login: LoginCacheElem = reactive({
    quickLogin: [],
    status: false,
    address: '',
    token: '',
    creating: false,
})
