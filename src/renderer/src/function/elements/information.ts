import { IpcRenderer } from '@electron-toolkit/preload'

export enum BotMsgType {
    CQCode,
    Array,
    Auto,
}

export interface RunTimeDataElem {
    sysConfig: { [key: string]: any }
    jsonMap?: any
    botInfo: { [key: string]: any }
    loginInfo: { [key: string]: any }
    userList: (UserFriendElem & UserGroupElem)[]
    showList: (UserFriendElem & UserGroupElem)[]
    groupAssistList: (UserFriendElem & UserGroupElem)[]
    onMsgList: (UserFriendElem & UserGroupElem)[]
    systemNoticesList?: { [key: string]: any }
    chatInfo: ChatInfoElem
    pageView: {
        chatView: any
        msgView: any
    }
    plantform: {
        reader?: IpcRenderer | null,
        capacitor?: any,
        pulgins?: any,
        vConsole?: any,
    },
    tags: {
        firstLoad: boolean
        msgType: BotMsgType
        canLoadHistory: boolean
        openSideBar: boolean
        viewer: {
            show?: boolean
            index: number
        }
        loginWaveTimer?: any
        isCapacitor: boolean
        isElectron: boolean
        platform: string | undefined
        release: string | undefined
        connectSsl: boolean
        classes: any[]
        sw?: boolean
        darkMode: boolean
    }
    watch: {
        // PS: 一些给监听器捕捉用的数据
        heartbeatTime?: number
        oldHeartbeatTime?: number
        lastHeartbeatTime?: number
        backTimes: number
    }
    messageList: any[]
    mergeMessageList?: any[] | undefined
    mergeMessageImgList?: any[] | undefined
    stickerCache?: any[]
    popBoxList: {
        // 通用弹窗
        svg?: string // 弹窗图标
        title?: string // 弹窗标题（缺省将没有标题栏和关闭按钮）
        html?: string // 填充 html（和下面的模板必须有一个）
        template?: any // 填充模板（如果都有，优先填充 html）
        templateValue?: any // 模板 props
        data?: any // 模板的附加传参，只有这一个
        full?: boolean // 是否填充整个页面
        button?: {
            // 按钮
            master?: boolean // 是否高亮（主按钮）
            fun?: (value: any) => void // 按钮回调
            text: string // 按钮文本
        }[]
        allowQuickClose?: boolean // 是否允许快速关闭
    }[]
}

export interface ChatInfoElem {
    show: BaseChatInfoElem
    info: {
        group_info: { [key: string]: any }
        user_info: { [key: string]: any }
        me_info: { [key: string]: any }
        group_members: GroupMemberInfoElem[]
        group_files: { [key: string]: any }
        group_sub_files: { [key: string]: any }
        group_notices?: { [key: string]: any }
        now_member_info?: { [key: string]: any }
        image_list?: { index: number; message_id: string; img_url: string }[]
        jin_info: {
            list: { [key: string]: any }[]
            is_end?: boolean
            pages: number
        }
    }
}

export interface BaseChatInfoElem {
    type: string
    id: number
    name: string
    avatar: string
    jump?: string
}

export interface UserElem {
    new_msg?: boolean
    raw_msg?: string
    time?: number
    always_top?: boolean
    message_id?: string
    highlight?: string
}

export interface UserFriendElem extends UserElem {
    group_id: number
    group_name: string
    py_name?: string
    py_start?: string
    member_count?: number
    admin_flag?: boolean
}

export interface UserGroupElem extends UserElem {
    user_id: number
    nickname: string
    remark: string
    raw_msg_base?: string       // 给群收纳箱用的
    py_name?: string
    py_start?: string
    class_id?: number
    class_name?: string
}

export interface GroupMemberInfoElem {
    user_id: number
    title: string
    card: string
    join_time: number
    last_sent_time: number
    level: number
    nickname: string
    rank: string
    role: string
    sex: string
    shutup_time: number
    py_start?: string
}

export interface SQCodeElem {
    addText: boolean
    addTop?: boolean
    msgObj: MsgItemElem
}

export interface MsgItemElem {
    type: string
    [key: string]: any
}
