import { ChatInfoElem, MergeStackData } from '@renderer/function/elements/information'
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

export const useChatStore = defineStore('chat', () => {
    const chatInfo = shallowRef<ChatInfoElem>({
        show: { type: '', id: 0, name: '', avatar: '' },
        info: {
            group_info: {},
            user_info: {},
            me_info: {},
            group_members: [],
            group_files: {},
            group_sub_files: {},
            jin_info: {
                list: [],
                pages: 0,
            },
        },
    })

    const messageList = shallowRef<any[]>([])
    const mergeMsgStack = shallowRef<MergeStackData[]>([])
    const mergeMessageList = shallowRef<any[] | undefined>(undefined)
    const mergeMessageImgList = shallowRef<any[] | undefined>(undefined)

    return {
        chatInfo,
        messageList,
        mergeMsgStack,
        mergeMessageList,
        mergeMessageImgList,
    }
})
