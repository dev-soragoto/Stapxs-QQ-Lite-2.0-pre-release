/**
 * @FileDescription: 本地历史消息工具（Tauri 平台）
 * @Description:
 *   封装对 Tauri 后端 db_* 命令的调用，提供类型安全的本地 SQLite 历史消息读写接口。
 *   非 Tauri 平台调用时会静默 no-op / 返回空数组，不影响其他平台逻辑。
 */

import { backend } from '@renderer/runtime/backend'
import { getMsgRawTxt } from './msgUtil'
import { Logger } from '../base'
import { runtimeData } from '../msg'

// ── 类型定义（与 Rust MsgRecord 对应） ───────────────────────────

export interface LocalMsgRecord {
    /** Bot 侧的消息 ID */
    message_id: string
    /** 会话 ID（group_id 或 user_id） */
    chat_id: number
    /** 会话类型："group" | "private" */
    chat_type: string
    /** 发送者 user_id */
    sender_id: number
    /** 发送者昵称（card 优先，fallback nickname） */
    sender_name: string | null
    /** 消息时间戳（秒，Bot 原始值） */
    time: number
    /** JSON 序列化的 MsgItemElem[] 消息段数组 */
    message: string
    /** 纯文本摘要 */
    raw_message: string | null
    /** 是否已撤回 */
    revoked: boolean
}

// ── 辅助：将运行时消息对象转换为 LocalMsgRecord ──────────────────

/**
 * 将已经过 msgPreprocess 处理的消息对象转成可存入 DB 的 LocalMsgRecord。
 * 若必要字段缺失则返回 null，调用方需过滤掉 null。
 */
export function msgToRecord(msg: any): LocalMsgRecord | null {
    const messageId = msg.message_id
    if (!messageId) return null

    const chatId: number = msg.infoList.group_id ?? msg.infoList.target_id
    if (chatId == null) return null

    const chatType: string =
        msg.message_type ?? (msg.group_id != null ? 'group' : 'private')
    const senderId: number = msg.infoList.sender
    if (senderId == null) return null

    const senderName: string | null =
        (msg.sender?.card && msg.sender.card !== '') ? msg.sender.card : (msg.sender?.nickname ?? null)

    let rawMessage: string | null = null
    try {
        rawMessage = getMsgRawTxt(msg) || msg.raw_message || null
    } catch {
        rawMessage = msg.raw_message ?? null
    }

    let messageSerialized: string
    try {
        messageSerialized = JSON.stringify(msg.message ?? [])
    } catch {
        messageSerialized = '[]'
    }

    return {
        message_id: String(messageId),
        chat_id: Number(chatId),
        chat_type: chatType,
        sender_id: Number(senderId),
        sender_name: senderName,
        time: Number(msg.time),
        message: messageSerialized,
        raw_message: rawMessage,
        revoked: false,
    }
}

// ── 读写接口 ──────────────────────────────────────────────────────

/**
 * 批量将消息保存到本地 SQLite（已有的 message_id 自动忽略，不覆盖）。
 *
 * @param selfId  当前登录账号 uin
 * @param msgs    已完成预处理的消息对象数组（来自 runtimeData.messageList 或 newMsg）
 */
export async function dbSaveMessages(selfId: string | number, msgs: any[]): Promise<void> {
    if(!runtimeData.sysConfig.enable_local_history) return

    const fistMsg = msgs[0]
    let chatId: number = fistMsg.infoList.group_id ?? fistMsg.infoList.target_id
    if(chatId == undefined) {
        msgs.forEach((item: any) => {
            // chatId 取第一个不是自己的 infoList.sender
            // PS：这边用来给某些获取历史消息没有 target_id 的消息补充 chatId 兜底
            if(item.infoList.sender != selfId) {
                chatId = item.infoList.sender
            }
        })
        msgs.forEach((item: any) => {
            item.infoList.target_id = chatId
         })
    }
    const records: LocalMsgRecord[] = msgs
        .map(msgToRecord)
        .filter((r): r is LocalMsgRecord => r !== null)

    if (records.length === 0) {
        new Logger().error(null, '[LocalHistory] dbSaveMessages: 没有有效消息可保存')
    }

    try {
        await backend.call(undefined, 'db:saveMessages', true, {
            selfId: String(selfId),
            messages: records,
        })
    } catch (e) {
        new Logger().error(e as unknown as Error, '[LocalHistory] dbSaveMessages 失败')
    }
}

/**
 * 获取某会话最新 n 条本地消息（正序，revoked 消息不包含）。
 *
 * @returns 消息段数组已反序列化的消息对象数组，出错或非 Tauri 返回空数组
 */
export async function dbGetLatest(
    selfId: string | number,
    chatId: number,
    n: number,
): Promise<any[]> {
    try {
        const records: LocalMsgRecord[] = await backend.call(
            undefined,
            'db:getLatest',
            true,
            { selfId: String(selfId), chatId, n },
        )
        return records.map(deserializeRecord)
    } catch (e) {
        new Logger().error(e as unknown as Error, '[LocalHistory] dbGetLatest 失败')
        return []
    }
}

/**
 * 获取锚点消息之前（更旧）的 n 条，不含锚点本身，正序返回。
 *
 * 典型用途：上拉加载更多历史。
 */
export async function dbGetBefore(
    selfId: string | number,
    chatId: number,
    messageId: string,
    n: number,
): Promise<any[]> {
    try {
        const records: LocalMsgRecord[] = await backend.call(
            undefined,
            'db:getBefore',
            true,
            { selfId: String(selfId), chatId, messageId, n },
        )
        return records.map(deserializeRecord)
    } catch (e) {
        new Logger().error(e as unknown as Error, '[LocalHistory] dbGetBefore 失败')
        return []
    }
}

/**
 * 获取锚点消息之后（更新）的 n 条，不含锚点本身，正序返回。
 *
 * 典型用途：从指定消息位置向后展开查看。
 */
export async function dbGetAfter(
    selfId: string | number,
    chatId: number,
    messageId: string,
    n: number,
): Promise<any[]> {
    try {
        const records: LocalMsgRecord[] = await backend.call(
            undefined,
            'db:getAfter',
            true,
            { selfId: String(selfId), chatId, messageId, n },
        )
        return records.map(deserializeRecord)
    } catch (e) {
        new Logger().error(e as unknown as Error, '[LocalHistory] dbGetAfter 失败')
        return []
    }
}

/**
 * 将指定 message_id 在本地 DB 中标记为已撤回。
 *
 * @returns 是否命中（true = DB 中存在该消息并更新成功）
 */
export async function dbRevokeMessage(
    selfId: string | number,
    messageId: string,
): Promise<boolean> {
    if(!runtimeData.sysConfig.enable_local_history) return false

    try {
        return await backend.call(undefined, 'db:revokeMessage', true, {
            selfId: String(selfId),
            messageId,
        })
    } catch (e) {
        new Logger().error(e as unknown as Error, '[LocalHistory] dbRevokeMessage 失败')
        return false
    }
}

// ── 内部工具 ──────────────────────────────────────────────────────

/**
 * 将 DB 返回的 LocalMsgRecord 还原为与 runtimeData.messageList 兼容的消息对象。
 */
function deserializeRecord(record: LocalMsgRecord): any {
    let message: any[]
    try {
        message = JSON.parse(record.message)
    } catch {
        message = []
    }
    return {
        message_id: record.message_id,
        // 根据 chat_type 恢复对应的 id 字段
        ...(record.chat_type === 'group' ? { group_id: record.chat_id } : { user_id: record.chat_id }),
        message_type: record.chat_type,
        sender: {
            user_id: record.sender_id,
            nickname: record.sender_name ?? '',
        },
        time: record.time,
        message,
        raw_message: record.raw_message ?? '',
        revoked: record.revoked,
        // 标记来源为本地缓存，业务层可按需用此字段区分
        _from_local_db: true,
    }
}
