import jp from 'jsonpath'
import app from '@renderer/main'
import anime from 'animejs'
import option from '@renderer/function/option'

import { Logger, PopInfo, PopType } from '@renderer/function/base'
import { runtimeData } from '@renderer/function/msg'
import { v4 as uuid } from 'uuid'
import { Connector } from '@renderer/function/connect'
import {
    BotMsgType,
    UserFriendElem,
    UserGroupElem,
} from '../elements/information'
import { sendStatEvent } from './appUtil'
import { callBackend } from './systemUtil'

const logger = new Logger()

/**
 * 根据 JSON Path 映射数据返回需要的内容体
 * @param msg
 * @param map
 * @returns
 */
export function getMsgData(
    name: string,
    msg: { [key: string]: any },
    map: string | { [key: string]: any },
) {
    let back = undefined as any
    // 解析数据
    if (map != undefined) {
        if (typeof map == 'string' || map.source != undefined) {
            try {
                back = jp.query(
                    msg,
                    replaceJPValue(typeof map == 'string' ? map : map.source),
                )
                if (back && typeof map != 'string' && map.list != undefined) {
                    const backList = [] as any[]
                    back.forEach((item) => {
                        const itemObj = {} as any
                        Object.keys(map.list).forEach((key: string) => {
                            if (map.list[key] && map.list[key] != '') {
                                if (map.list[key].startsWith('/'))
                                    itemObj[key] =
                                        item[map.list[key].substring(1)]
                                else {
                                    let nameKey = map.list[key]
                                    let regexKey = null
                                    if (nameKey.indexOf('@') > -1) {
                                        const [name, key] = nameKey.split('@')
                                        nameKey = name
                                        regexKey = key
                                    }
                                    itemObj[key] = jp.query(
                                        item,
                                        replaceJPValue(nameKey),
                                    )
                                    if (regexKey != null) {
                                        const regex = new RegExp(regexKey)
                                        const match = itemObj[key].match(regex)
                                        if (match != null) {
                                            itemObj[key] = match[0]
                                        }
                                    }
                                }
                            }
                        })
                        backList.push(itemObj)
                    })
                    back = backList
                }
            } catch (ex) {
                logger.error(
                    ex as Error,
                    `解析消息 JSON 错误：${name} -> ${map}`,
                )
            }
        } else {
            const data = {} as { [key: string]: any }
            Object.keys(map).forEach((key) => {
                if (
                    map[key] != undefined &&
                    map[key] !== '' &&
                    !key.startsWith('_')
                )
                    try {
                        data[key] = jp.query(msg, replaceJPValue(map[key]))[0]
                    } catch (ex) {
                        logger.error(
                            ex as Error,
                            `解析 JSON 错误：${name} -> ${map}`,
                        )
                    }
            })
            back = [data]
        }
    }
    return back
}
function replaceJPValue(jpStr: string) {
    return jpStr.replaceAll('<uin>', runtimeData.loginInfo.uin)
}

/**
 * 获取表情图片，优先返回 gif，不存在的返回 png
 * @param id 表情编号
 * @returns 表情图片
 */
export function getFace(id: number) {
    const pathList = import.meta.glob('@renderer/assets/img/qq-face/public/*/s*.*',
        { eager: true }
    )
    for(const path in pathList) {
        if (path.includes(`/s${id}.gif`)) {
            return (pathList[path] as any).default
        }
    }
    for(const path in pathList) {
        if (path.includes(`/s${id}.png`)) {
            return (pathList[path] as any).default
        }
    }
    return ''
}

/**
 * 将一个消息体列表组装为基础消息列表便于解析（message 消息体可能不正确）
 * @param msgList
 * @param map
 * @returns
 */
export function buildMsgList(msgList: { [key: string]: any }): {
    [key: string]: any
} {
    const path = jp.parse(runtimeData.jsonMap.message_list.source)
    const keys = [] as string[]
    path.forEach((item) => {
        if (item.expression.value != '*' && item.expression.value != '$') {
            keys.push(item.expression.value)
        }
    })
    const result = {} as any
    let acc = result
    keys.forEach((key, index) => {
        if (index === keys.length - 1) {
            acc[key] = msgList
        } else {
            acc[key] = {}
        }
        acc = acc[key]
    })
    return result
}

export function parseMsgList(
    list: any,
    map: string,
    valueMap: { [key: string]: any },
): any[] {
    // 判断消息类型
    if (typeof list[0].message == 'string') {
        runtimeData.tags.msgType = BotMsgType.CQCode
    } else {
        runtimeData.tags.msgType = BotMsgType.Array
    }
    // 消息类型的特殊处理
    switch (runtimeData.tags.msgType) {
        case BotMsgType.CQCode: {
            // 这儿会默认处理成 oicq2 的格式，所以 CQCode 消息请使用 oicq2 配置文件修改
            for (let i = 0; i < list.length; i++) {
                list[i] = parseCQ(list[i])
            }
            break
        }
        case BotMsgType.Array: {
            // 非扁平化消息体，这儿会取 _type 后半段的 JSON Path 将结果并入 message
            for (let i = 0; i < list.length; i++) {
                let msgList = list[i].message
                if (msgList == undefined) {
                    msgList = list[i].content
                }
                for (let j = 0; j < msgList.length; j++) {
                    const data = getMsgData(
                        'message_list_message',
                        msgList[j],
                        map,
                    )
                    // 如果 data 里有 type 字段，改成 type_item
                    if(data[0] && data[0]['type'] != undefined) {
                        data[0]['type_item'] = data[0]['type']
                        delete data[0]['type']
                    }
                    if (data != undefined && data.length == 1) {
                        msgList[j] = Object.assign(msgList[j], data[0])
                    }
                }
            }
        }
    }
    // 消息字段的标准化特殊处理
    if (valueMap != undefined) {
        for (let i = 0; i < list.length; i++) {
            Object.entries(valueMap).forEach(([type, values]) => {
                Object.entries(values).forEach(([key, value]) => {
                    let content = list[i].message
                    if (content == undefined) {
                        content = list[i].content
                    }
                    content.forEach((item: any) => {
                        if (item.type == type) {
                            item[key] = jp.query(item, value as string)[0]
                        }
                        // 顺便把没用的 data 删了，这边要注意 item.data 必须是个对象
                        // 因为有些消息类型的 data 就叫 data
                        if (typeof item.data == 'object') {
                            delete item.data
                        }
                    })
                    // 其他处理
                    if (list[i].content != undefined) {
                        // 把 content 改成 message
                        list[i].message = content
                        delete list[i].content
                        // 添加一个 sender.user_id 为 user_id
                        list[i].sender = {
                            user_id: list[i].user_id,
                            nickname: list[i].nickname,
                        }
                    }
                })
            })
        }
    }
    return list
}

/**
 * 将消息对象处理为扁平字符串
 * @param message 待处理的消息对象
 * @returns 字符串
 */
export function getMsgRawTxt(data: any): string {
    const { $t } = app.config.globalProperties

    const message = data.message as [{ [key: string]: any }]
    const fromId = data.group_id ?? data.user_id
    let back = ''
    for (let i = 0; i < message.length; i++) {
        try {
            switch (message[i].type) {
                case 'at':
                    if (message[i].text == undefined) {
                        // 群内才可以 at，如果 at 消息中没有 text 字段
                        // 尝试去群成员列表中找到对应的昵称，群成员列表只在当前打开的群才有
                        if (
                            runtimeData.chatInfo.show.id == fromId &&
                            runtimeData.chatInfo.info.group_members
                        ) {
                            const user =
                                runtimeData.chatInfo.info.group_members.find(
                                    (item) => item.user_id == message[i].qq,
                                )
                            if (user) {
                                back +=
                                    '@' +
                                    (user.card && user.card != ''? user.card: user.nickname)
                                break
                            }
                        }
                        break
                    }
                // eslint-disable-next-line
                case 'text':
                    back += message[i].text
                        .replaceAll('\n', ' ')
                        .replaceAll('\r', ' ')
                    break
                case 'forward':
                    back += '[' + $t('聊天记录') + ']'
                    break
                case 'face':
                    back += '[' + $t('表情') + ']'
                    break
                case 'bface':
                    back += message[i].text
                    break
                case 'image':
                    back +=
                        (!message[i].summary || message[i].summary == '') ? '[' + $t('图片') + ']' : message[i].summary
                    break
                case 'record':
                    back += '[' + $t('语音') + ']'
                    break
                case 'video':
                    back += '[' + $t('视频') + ']'
                    break
                case 'file':
                    back += '[' + $t('文件') + ']'
                    break
                case 'json': {
                    try {
                        back += JSON.parse(message[i].data).prompt
                    } catch (error) {
                        back += '[' + $t('卡片消息') + ']'
                    }
                    break
                }
                case 'xml': {
                    let name = message[i].data.substring(
                        message[i].data.indexOf('<source name="') + 14,
                    )
                    name = name.substring(0, name.indexOf('"'))
                    back += '[' + name + ']'
                    break
                }
            }
        } catch (error) {
            logger.error(
                error as Error,
                '解析消息短格式错误：' + JSON.stringify(message[i]),
            )
        }
    }
    return back
}

/**
 * 将消息对象转换为 CQCode
 * @param data
 * @returns CQCode 字符串
 */
export function parseJSONCQCode(data: any) {
    let back = ''
    data.forEach((item: any) => {
        if (item.type != 'text') {
            let body = '[CQ:' + item.type + ','
            Object.keys(item).forEach((key: any) => {
                body += `${key}=${item[key]},`
            })
            body = body.substring(0, body.length - 1) + ']'
            back += body
        } else {
            back += item.text
        }
    })
    return back
}

/**
 * 将扁平的 CQCode 消息处理成消息对象
 * @param msg CQCode 消息
 * @returns 消息对象
 */
export function parseCQ(data: any) {
    let msg = data.message as string
    // 将纯文本也处理为 CQCode 格式
    // PS：这儿不用担心方括号本身，go-cqhttp 会把它转义掉
    let reg = /^[^\]]+?\[|\].+\[|\][^[]+$|^[^[\]]+$/g
    const textList = msg.match(reg)
    if (textList !== null) {
        textList.forEach((item) => {
            item = item.replace(']', '').replace('[', '')
            msg = msg.replace(item, `[CQ:text,text=${item}]`)
        })
    }
    // 拆分 CQCode
    reg = /\[.+?\]/g
    msg = msg.replaceAll('\n', '\\n')
    const list = msg.match(reg)
    // 处理为 object
    const back: { [ket: string]: any }[] = []
    reg = /\[CQ:([^,]+),(.*)\]/g
    if (list !== null) {
        list.forEach((item) => {
            if (item.match(reg) !== null) {
                const info: { [key: string]: any } = { type: RegExp.$1 }
                RegExp.$2.split(',').forEach((key: string) => {
                    const kv = [] as string[]
                    kv.push(key.substring(0, key.indexOf('=')))
                    // 对 html 转义字符进行反转义
                    const a = document.createElement('a')
                    a.innerHTML = key.substring(key.indexOf('=') + 1)
                    kv.push(a.innerText)
                    info[kv[0]] = kv[1]
                })
                // 对文本消息特殊处理
                if (info.type == 'text') {
                    info.text = RegExp.$2
                        .substring(RegExp.$2.lastIndexOf('=') + 1)
                        .replaceAll('\\n', '\n')
                    // 对 html 转义字符进行反转义
                    const a = document.createElement('a')
                    a.innerHTML = info.text
                    info.text = a.innerText
                }
                // 对回复消息进行特殊处理
                if (info.type == 'reply') {
                    data.source = {
                        user_id: info.user_id,
                        seq: info.seq,
                        message: info.message,
                    }
                } else {
                    back.push(info)
                }
            }
        })
    }
    logger.debug('解析 CQ 消息结果: ' + JSON.stringify(back))
    data.message = back
    return data
}

/**
* 发送消息
* @param id 发送对象的 id
* @param type 发送对象的类型
* @param msg 消息体
* @param preShow 是否消息预显
* @param echo 回显的事件名
*/
export function sendMsgRaw(
    id: string,
    type: string,
    msg: string | any[] | undefined,
    preShow = false,
    echo = 'sendMsgBack',
) {
    // 如果消息为空则不发送
    if(msg == undefined || msg == '' || (Array.isArray(msg) && msg.length == 0)) {
        return
    }
    // 预发送消息
    // 将消息构建为完整消息体先显示出去
    const msgUUID = uuid()
    if (preShow) {
        const preShowMsg = JSON.parse(JSON.stringify(msg));
        preShowMsg.forEach((item: any) => {
            // 对 base64 图片做特殊处理
            if (item.type == 'image') {
                if(!item.file.startsWith('http')) {
                    const b64Str = (item.file as string).substring(9)
                    item.url = 'data:image/png;base64,' + b64Str
                } else {
                    item.url = item.file
                }
            }
        })
        const showMsg = {
            revoke: true,
            fake_msg: true,
            message_id: msgUUID,
            fake_message_id: msgUUID,       // 用来作为这条消息的唯一标识，防止 message_id 刷新导致的闪烁
            message_type: runtimeData.chatInfo.show.type,
            time: parseInt(String(new Date().getTime() / 1000)),
            post_type: 'message',
            sender: {
                user_id: runtimeData.loginInfo.uin,
                nickname: runtimeData.loginInfo.nickname,
            },
            message: preShowMsg,
        } as { [key: string]: any }
        showMsg.raw_message = getMsgRawTxt(showMsg)

        if (showMsg.message_type == 'group') {
            showMsg.group_id = runtimeData.chatInfo.show.id
        } else {
            showMsg.user_id = runtimeData.chatInfo.show.id
        }
        runtimeData.messageList = runtimeData.messageList.concat([showMsg])
    }
    // 检查消息体是否需要处理
    if (runtimeData.tags.msgType == BotMsgType.Array) {
        if (msg && typeof msg != 'string') {
            const newMsg = [] as any
            msg.forEach((item) => {
                const newResult = {} as { [key: string]: any }
                newResult.type = item.type
                newResult.data = item
                delete newResult.data.type
                // 特殊处理，如果 newResult.data 里有 _type 字段，给它改成 type
                if (newResult.data._type != undefined) {
                    newResult.data.type = newResult.data._type
                    delete newResult.data._type
                }
                newMsg.push(newResult)
            })
            msg = newMsg
        }
    }
    if (msg !== undefined && msg.length > 0) {
        if (runtimeData.jsonMap.name === 'Lagrange.OneBot'){
            lgrSendMsg(id, msg, type, echo + '_uuid_' + msgUUID)
            sendStatEvent('sendMsg', { type: type })
            return
        }
        switch (type) {
            case 'group':
                Connector.send(
                    runtimeData.jsonMap.message_list.name_group_send ??
                        'send_msg',
                    { group_id: id, message: msg },
                    echo + '_uuid_' + msgUUID,
                )
                break
            case 'user': {
                if (String(id).indexOf('/') > 1) {
                    Connector.send(
                        runtimeData.jsonMap.message_list.name_temp_send ??
                            'send_temp_msg',
                        {
                            user_id: id.split('/')[0],
                            group_id: id.split('/')[1],
                            message: msg,
                        },
                        echo + '_uuid_' + msgUUID,
                    )
                } else {
                    Connector.send(
                        runtimeData.jsonMap.message_list.name_user_send ??
                            'send_msg',
                        { user_id: id, message: msg },
                        echo + '_uuid_' + msgUUID,
                    )
                }
                break
            }
        }
        sendStatEvent('sendMsg', { type: type })
    }
}

export function updateLastestHistory(item: UserFriendElem & UserGroupElem) {
    // 发起获取历史消息请求
    const type = item.user_id ? 'user' : 'group'
    const id = item.user_id ? item.user_id : item.group_id
    let name
    if (runtimeData.jsonMap.message_list && type != 'group') {
        name = runtimeData.jsonMap.message_list.private_name
    } else {
        name = runtimeData.jsonMap.message_list.name
    }
    Connector.send(
        name ?? 'get_chat_history',
        {
            message_type: runtimeData.jsonMap.message_list.message_type[type],
            group_id: id,
            user_id: id,
            message_seq: 0,
            message_id: 0,
            count: 1,
        },
        'getChatHistoryOnMsg_' + id,
    )
}

/**
 * 刷新消息列表排序
 */
export function updateBaseOnMsgList() {
    const allList = [...runtimeData.baseOnMsgList.values()]
    // 先更具 item.always_top 是不是 true 拆为两个数组
    const topList = allList.filter((item) => item.always_top)
    const normalList = allList.filter((item) => !item.always_top)
    // 将两个数组按照 item.time 降序排序
    // item.time 不存在或者相同时按照 item.py_start 降序排序

    const sortFun = (
        a: UserFriendElem & UserGroupElem,
        b: UserFriendElem & UserGroupElem,
    ) => {
        if (a.time == b.time || a.time == undefined || b.time == undefined) {
            if (a.py_start == undefined || b.py_start == undefined) {
                return 0
            }
            return b.py_start.charCodeAt(0) - a.py_start.charCodeAt(0)
        }
        return b.time - a.time
    }
    topList.sort(sortFun)
    normalList.sort(sortFun)

    let onMsgList = [] as any[]
    let groupAssistList = [] as any[]
    if(runtimeData.sysConfig.bubble_sort_user) {
        // 将 normalList 进行拆分
        onMsgList = topList.concat(normalList.filter((item) => {
            return item.group_id && canGroupNotice(item.group_id) ||
                item.user_id || item.new_msg || item.highlight
        }))
        groupAssistList = normalList.filter((item) => {
            return item.group_id && !canGroupNotice(item.group_id)
        })
    } else {
        onMsgList = topList.concat(normalList)
    }

    runtimeData.onMsgList = onMsgList
    runtimeData.groupAssistList = groupAssistList
}

/**
 * 判断当前消息是否可以通知
 * @param id 群号
 * @returns 是否可以通知
 */
export function canGroupNotice(id: number) {
    const noticeInfo = option.get('notice_group') ?? {}
    const list = noticeInfo[runtimeData.loginInfo.uin]
    if (list) {
        return list.indexOf(id) >= 0
    }
    return false
}

/**
 * 戳一戳触发动画
 * @param animeBody 动画作用的元素
 * @param windowInfo 窗口信息，在 electron 中使用
 */
export function pokeAnime(animeBody: HTMLElement | null, windowInfo = null as {
            x: number
            y: number
            width: number
            height: number
        } | null) {
    if (animeBody) {
        const timeLine = anime.timeline({ targets: animeBody })
        // 如果窗口小于 500px 播放完整的动画（手机端样式）
        if (
            (document.getElementById('app')?.offsetWidth ?? 500) <
            500
        ) {
            navigator.vibrate([10, 740, 10])
            timeLine.add({ translateX: 30, duration: 600, easing: 'cubicBezier(.44,.09,.53,1)' })
                .add({ translateX: 0, duration: 150, easing: 'cubicBezier(.44,.09,.53,1)' })
                .add({ translateX: [0, 25, 0], duration: 500, easing: 'cubicBezier(.21,.27,.82,.67)' })
                .add({ targets: {}, duration: 1000 })
                .add({ translateX: 70, duration: 1300, easing: 'cubicBezier(.89,.72,.72,1.13)' })
                .add({ translateX: 0, duration: 100, easing: 'easeOutSine' })
        }
        timeLine.add({ translateX: [-10, 10, -5, 5, 0], duration: 500, easing: 'cubicBezier(.44,.09,.53,1)' })
        timeLine.change = async () => {
            if (animeBody) {
                animeBody.parentElement?.parentElement?.classList.add( 'poking')
                const teansformX = animeBody.style.transform
                // teansformX 的数字可能是科学计数法，需要转换为普通数字
                let num = Number((teansformX.match(/-?\d+\.?\d*/g) ?? [0])[0])
                // 取整
                num = Math.round(num)
                // 输出 translateX
                if (['electron', 'tauri'].includes(runtimeData.tags.clientType) && windowInfo) {
                    await callBackend(undefined, 'win:move', false, {
                            x: windowInfo.x + num,
                            y: windowInfo.y,
                        })
                }
            }
        }
        timeLine.changeComplete = () => {
            if (animeBody) {
                animeBody.parentElement?.parentElement?.classList.remove('poking')
            }
        }
    }
}

export function sendMsgAppendInfo(msg: any) {
    if (msg.message) {
        msg.message.forEach(() => {
            // TODO: 消息附加功能，暂时没用到
        })
    }
}

/**
 *
 * @param base group_name 或者 nickname
 * @param remark remark
 * @returns 显示的名称
 */
export function getShowName(base: string, remark: string) {
    if (!remark || remark == '' || remark == base) {
        return base.replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
    } else {
        return (remark + '（' + base + '）').replace(/[\u202A-\u202E\u2066-\u2069]/g, '')
    }
}

/**
 * 判断是否需要显示时间戳（上下超过五分钟的消息）
 * @param timePrv 上条消息的时间戳（10 位）
 * @param timeNow 当前消息的时间戳（10 位）
 */
export function isShowTime(
    timePrv: number | undefined,
    timeNow: number,
    alwaysShow = false,
): boolean {
    if (alwaysShow) return true
    if (timePrv == undefined) return false
    // 五分钟 10 位时间戳相差 300
    return timeNow - timePrv >= 300
}

/**
 * 判断这个消息是不是[已删除]
 * @param msg
 */
export function isDeleteMsg(msg: any): boolean {
    if(runtimeData.sysConfig.dont_parse_delete === true)return false
    if(!['message', 'message_sent'].includes(msg.post_type)) return false
    if(msg.sender.user_id !== runtimeData.loginInfo.uin)return false
    if(msg.raw_message !== '&#91;已删除&#93;')return false
    return true
}

/**
 * lgr专用发送消息，懒得写了，不做通用适配，胡乱应付下吧
 * @param msg 消息内容
 */
function lgrSendMsg(id: string, msg: any, type: string, cb: string){
    if (msg[0].type === 'node') {
        const sendMsgs = [] as any[]
        msg.forEach((item) => {
            const msg = {
                type: item.type,
                data: {
                    user_id: item.data.user_id.toString(),
                    nickname: item.data.nickname,
                    content: item.data.content.map((item)=>{
                        const copy = {...item}
                        delete copy.type
                        return {
                            type: item.type,
                            data: {...copy}
                        }
                    }),
                },
            }
            sendMsgs.push(msg)
        })
        if (type === 'group') {
            Connector.send(
                'send_group_forward_msg',
                { group_id: id, messages: sendMsgs },
                cb,
            )
        }else if (type === 'user') {
            Connector.send(
                'send_private_forward_msg',
                { user_id: id, messages: sendMsgs },
                cb,
            )
        }else {
            new PopInfo().add(PopType.ERR, 'lgr不支持匿名聊天')
        }
    }else {
        if (type === 'group'){
            Connector.send(
                'send_group_msg',
                { group_id: id, message: msg },
                cb,
            )
        }else if (type === 'user'){
            Connector.send(
                'send_private_msg',
                { user_id: id, message: msg },
                cb,
            )
        }else{
            new PopInfo().add(PopType.ERR, 'lgr不支持匿名聊天')
        }
    }
}
