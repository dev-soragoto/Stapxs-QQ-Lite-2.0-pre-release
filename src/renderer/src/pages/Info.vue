<!--
 * @FileDescription: 群 / 好友信息页面
 * @Author: Stapxs
 * @Date: missing
 * @Version: 1.0
-->

<template>
    <div v-if="tags.openChatInfo"
        class="chat-info-pan">
        <div class="ss-card chat-info">
            <header>
                <span v-if="chat.show.type === 'group'">{{ $t('群资料') }}</span>
                <span v-if="chat.show.type === 'user'">{{ $t('好友') }}</span>
                <font-awesome-icon :icon="['fas', 'xmark']" @click="closeChatInfoPan" />
            </header>
            <div :class="'chat-info-base ' + chat.show.type">
                <div>
                    <img :src="chat.show.avatar">
                    <div>
                        <a>{{ chat.show.name }}</a>
                        <span>{{ chat.show.id }}</span>
                    </div>
                    <div style="display: flex;align-items: center;justify-content: center;cursor: pointer;"
                        @click="copyText(chat.show.id)">
                        <font-awesome-icon :icon="['fas', 'copy']" />
                    </div>
                </div>
                <div v-if="chat.show.type === 'group'"
                    v-show="Object.keys(chat.info.group_info).length > 0">
                    <header>
                        <span>{{ $t('介绍') }}</span>
                    </header>
                    <span v-html=" chat.info.group_info.gIntro === undefined || chat.info.group_info.gIntro === '' ?
                        $t('群主很懒，还没有群介绍哦～') : chat.info.group_info.gIntro" />
                    <div class="tags">
                        <div v-for="item in chat.info.group_info.tags" :key="item.md">
                            {{ item.tag }}
                        </div>
                    </div>
                </div>
                <div v-else-if="chat.show.type === 'user'">
                    <header v-if="chat.info.user_info.qid">
                        <span>QID</span>
                    </header>
                    <span v-if="chat.info.user_info.qid">{{ chat.info.user_info.qid }}</span>
                    <header>
                        <span>{{ $t('等级') }}</span>
                    </header>
                    <span>{{ qqLevelToEmoji(chat.info.user_info.qqLevel) }}</span>
                    <header v-if="chat.info.user_info.regTime">
                        <span>{{ $t('注册时间') }}</span>
                    </header>
                    <span v-if="chat.info.user_info.regTime">{{ Intl.DateTimeFormat(trueLang, { year: 'numeric' })
                        .format(new Date(chat.info.user_info.regTime * 1000)) }}</span>
                    <header>
                        <span>{{ $t('签名') }}</span>
                    </header>
                    <span>{{ chat.info.user_info.longNick ? chat.info.user_info.longNick : $t("这个人很懒什么都没有写～") }}</span>
                    <header>
                        <span>{{ $t('其他信息') }}</span>
                    </header>
                    <div class="outher">
                        <span v-if="chat.info.user_info.birthday_year">{{ $t('生日') }}:
                            <span>
                                {{ Intl.DateTimeFormat(trueLang, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                }).format(new Date(
                                    `${chat.info.user_info.birthday_year}-${
                                        chat.info.user_info.birthday_month}-${
                                        chat.info.user_info.birthday_day}`,
                                )) }}
                            </span>
                        </span>
                        <span v-if="chat.info.user_info.country">{{ $t('地区') }}:
                            <span>
                                {{
                                    `${chat.info.user_info.country}-${
                                        chat.info.user_info.province}-${
                                        chat.info.user_info.city}`
                                }}
                            </span>
                        </span>
                    </div>
                    <!-- <template v-if="!chat.show.temp">
                        <header>
                            <span>{{ $t('设置') }}</span>
                        </header>
                        <OptInfo
                            :type="'number'"
                            :chat="chat" />
                    </template> -->
                </div>
            </div>
            <BcTab v-if="chat.show.type === 'group'"
                class="chat-info-tab">
                <div :name="$t('成员')">
                    <div class="chat-info-tab-member">
                        <div class="search-view">
                            <input :placeholder="$t('搜索 ……')" @input="searchList">
                        </div>
                        <div v-for="item in number_cache.length > 0 ? number_cache : chat.info.group_members"
                            :key="'chatinfomlist-' + item.user_id" class="edit">
                            <img alt="nk" loading="lazy"
                                :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.user_id}`">
                            <div>
                                <a @click="startChat(item)">{{
                                    item.card ? item.card : item.nickname
                                }}</a>
                                <font-awesome-icon v-if="item.role === 'owner'" :icon="['fas', 'crown']" />
                                <font-awesome-icon v-if="item.role === 'admin'" :icon="['fas', 'star']" />
                            </div>
                            <!-- 在手机端戳 id 就能触发 -->
                            <span @click="moreConfig(item)">{{ item.user_id }}</span>
                            <font-awesome-icon v-if="canEditMember(item.role)" :icon="['fas', 'wrench']" @click="moreConfig(item)" />
                            <font-awesome-icon v-else :icon="['fas', 'copy']" @click="moreConfig(item.user_id)" />
                        </div>
                    </div>
                </div>
                <div :name="$t('公告')">
                    <div class="bulletins">
                        <BulletinBody
                            v-for="(item, index) in chat.info.group_notices ?? []"
                            :key="'bulletins-' + index"
                            :data="item"
                            :index="index" />
                    </div>
                </div>
                <div :name="$t('文件')">
                    <div
                        class="group-files">
                        <div v-for="item in chat.info.group_files"
                            :key="'file-' + (item.folder_id ?? item.file_id)">
                            <FileBody :chat="chat" :item="item" />
                        </div>
                    </div>
                </div>
                <div :name="$t('设置')">
                    <div style="padding: 0 20px">
                        <OptInfo :type="'group'" :chat="chat"
                            @update_mumber_card="updateMumberCard" />
                    </div>
                </div>
            </BcTab>
            <div :class="'ss-card user-config' + (Object.keys(showUserConfig).length > 0 ? ' show' : '')">
                <div>
                    <img alt="nk" :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${showUserConfig.user_id}`">
                    <div>
                        <a>{{ showUserConfig.card != '' ? showUserConfig.card : showUserConfig.nickname }}</a>
                        <span>{{ showUserConfig.user_id }}</span>
                    </div>
                    <font-awesome-icon
                        style="margin-right: 20px;"
                        :icon="['fas', 'copy']"
                        @click="copyText(showUserConfig.user_id)" />
                    <font-awesome-icon :icon="['fas', 'angle-down']" @click="showUserConfig = {}" />
                </div>
                <div>
                    <header>{{ $t('成员信息') }}</header>
                    <div class="opt-item">
                        <font-awesome-icon :icon="['fas', 'clipboard-list']" />
                        <div>
                            <span>{{ $t('成员昵称') }}</span>
                            <span>{{
                                $t('啊吧啊吧……')
                            }}</span>
                        </div>
                        <input v-model="showUserConfigRaw.card"
                            style="width: 50%"
                            class="ss-input"
                            type="text"
                            @change="updateMumberCard($event, showUserConfig)">
                    </div>
                    <div v-if="chat.info.me_info.role === 'owner'" class="opt-item">
                        <font-awesome-icon :icon="['fas', 'clipboard-list']" />
                        <div>
                            <span>{{ $t('成员头衔') }}</span>
                            <span>{{
                                $t('猪咪猪咪')
                            }}</span>
                        </div>
                        <input v-model="showUserConfigRaw.title"
                            style="width: 50%"
                            class="ss-input"
                            type="text"
                            @change="updateMumberTitle($event, showUserConfig)">
                    </div>
                    <template v-if="showUserConfig.role === 'member'">
                        <header>{{ $t('操作') }}</header>
                        <div class="opt-item">
                            <font-awesome-icon :icon="['fas', 'clipboard-list']" />
                            <div>
                                <span>{{ $t('禁言成员') }}</span>
                                <span>{{
                                    $t('要让小猫咪不许说话几分钟呢？')
                                }}</span>
                            </div>
                            <input v-model="mumberInfo.banMin"
                                style="width: 50%"
                                class="ss-input"
                                type="text"
                                @input="checkNumber"
                                @change="banMumber($event, showUserConfig)">
                        </div>
                        <button class="ss-button"
                            @click="removeUser(showUserConfig.nickname, chat.show.id, showUserConfig.user_id)">
                            {{ $t('移出群聊') }}
                        </button>
                    </template>
                </div>
            </div>
        </div>
        <div class="card-info-pan-bg" />
    </div>
</template>

<script lang="ts">
    import app from '@renderer/main'
    import BulletinBody from '@renderer/components/BulletinBody.vue'
    import FileBody from '@renderer/components/FileBody.vue'
    import OptInfo from './options/OptInfo.vue'
    import BcTab from 'vue3-bcui/packages/bc-tab'

    import { Connector } from '@renderer/function/connect'
    import { PopInfo, PopType } from '@renderer/function/base'
    import { defineComponent, toRaw } from 'vue'
    import { getTrueLang } from '@renderer/function/utils/systemUtil'
    import { runtimeData } from '@renderer/function/msg'
    import {
        UserFriendElem,
        UserGroupElem,
    } from '@renderer/function/elements/information'
    import { qqLevelToEmoji } from '@renderer/function/utils/msgUtil'

    export default defineComponent({
        name: 'ViewInfo',
        components: { BulletinBody, FileBody, OptInfo, BcTab },
        props: ['tags', 'chat'],
        emits: ['close'],
        data() {
            return {
                qqLevelToEmoji,
                runtimeData: runtimeData,
                trueLang: getTrueLang(),
                isTop: false,
                number_cache: [] as any[],
                showUserConfig: {} as any,
                showUserConfigRaw: {} as any,
                mumberInfo: {
                    banMin: 0,
                }
            }
        },
        methods: {
            /**
             * 移出群聊
             */
            removeUser(nickname: string, group_id: number, user_id: number) {
                const popInfo = {
                    title: this.$t('提醒'),
                    html: `<span>${this.$t('真的要将 {user} 移出群聊吗', { user: nickname })}</span>`,
                    button: [
                        {
                            text: app.config.globalProperties.$t('确定'),
                            fun: () => {
                                Connector.send(
                                    'set_group_kick',
                                    {
                                        group_id: group_id,
                                        user_id: user_id,
                                    },
                                    'setGroupKick',
                                )
                                runtimeData.popBoxList.shift()
                            },
                        },
                        {
                            text: app.config.globalProperties.$t('取消'),
                            master: true,
                            fun: () => {
                                runtimeData.popBoxList.shift()
                            },
                        },
                    ],
                }
                runtimeData.popBoxList.push(popInfo)
            },

            copyText(text: any) {
                const popInfo = new PopInfo()
                app.config.globalProperties.$copyText(String(text)).then(
                    () => {
                        popInfo.add(PopType.INFO, this.$t('复制成功'), true)
                    },
                    () => {
                        popInfo.add(PopType.ERR, this.$t('复制失败'), true)
                    },
                )
            },

            banMumber(event: Event, info: any) {
                const value = (event.target as HTMLInputElement).value
                if (value !== '') {
                    const num = parseInt(value)
                    if (num > 0) {
                        const popInfo = {
                            title: this.$t('操作'),
                            html: `<span>${this.$t('确认禁言？')}</span>`,
                            button: [
                                {
                                    text: this.$t('确认'),
                                    fun: () => {
                                        const name = runtimeData.jsonMap.ban_mumber?.name
                                        if (name)
                                            Connector.send(name, {
                                                group_id: runtimeData.chatInfo.show.id,
                                                user_id: info.user_id,
                                                duration: num * 60,
                                            }, 'banMumber')
                                        runtimeData.popBoxList.shift()
                                        this.closeChatInfoPan()
                                    },
                                },
                                {
                                    text: this.$t('取消'),
                                    master: true,
                                    fun: () => {
                                        this.showUserConfigRaw = JSON.parse(JSON.stringify(info))
                                        runtimeData.popBoxList.shift()
                                    },
                                },
                            ],
                        }
                        runtimeData.popBoxList.push(popInfo)
                    }
                }
            },

            updateMumberCard(event: Event, info: any) {
                const value = (event.target as HTMLInputElement).value
                if (this.showUserConfig.card !== value) {
                    const popInfo = {
                        title: this.$t('操作'),
                        html: `<span>${this.$t('确认修改昵称？')}</span>`,
                        button: [
                            {
                                text: this.$t('确认'),
                                fun: () => {
                                    const name = runtimeData.jsonMap.set_group_nickname?.name
                                        if(name)
                                        Connector.send(name, {
                                            group_id: runtimeData.chatInfo.show.id,
                                            user_id: info.user_id,
                                            card: value,
                                        }, 'updateGroupMemberInfo')
                                    runtimeData.popBoxList.shift()
                                    this.closeChatInfoPan()
                                },
                            },
                            {
                                text: this.$t('取消'),
                                master: true,
                                fun: () => {
                                    this.showUserConfigRaw = JSON.parse(JSON.stringify(info))
                                    runtimeData.popBoxList.shift()
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                }
            },

            updateMumberTitle(event: Event, info: any) {
                const value = (event.target as HTMLInputElement).value
                if (this.showUserConfig.card !== value) {
                    const popInfo = {
                        title: this.$t('操作'),
                        html: `<span>${this.$t('确认修改头衔？')}</span>`,
                        button: [
                            {
                                text: this.$t('确认'),
                                fun: () => {
                                    const name = runtimeData.jsonMap.set_group_title?.name
                                        if(name)
                                        Connector.send(name, {
                                            group_id: runtimeData.chatInfo.show.id,
                                            user_id: info.user_id,
                                            special_title: value,
                                        }, 'updateGroupMemberInfo')
                                    runtimeData.popBoxList.shift()
                                    this.closeChatInfoPan()
                                },
                            },
                            {
                                text: this.$t('取消'),
                                master: true,
                                fun: () => {
                                    this.showUserConfigRaw = JSON.parse(JSON.stringify(info))
                                    runtimeData.popBoxList.shift()
                                },
                            },
                        ],
                    }
                    runtimeData.popBoxList.push(popInfo)
                }
            },

            getBanTimeMin(endTime: number) {
                // endTime 可能是精确到秒的时间戳
                if(endTime < 10000000000) {
                    endTime *= 1000
                }
                const now = new Date().getTime()
                const time = endTime - now
                if (time > 0) {
                    return Math.floor(time / 1000 / 60)
                } else {
                    return 0
                }
            },

            checkNumber(event: Event) {
                const value = (event.target as HTMLInputElement).value
                if (value !== '') {
                    const num = parseInt(value)
                    if (isNaN(num)) {
                        (event.target as HTMLInputElement).value = ''
                    } else if (num < 0) {
                        (event.target as HTMLInputElement).value = '0'
                    }
                }
            },

            /**
             * 关闭面板
             */
            closeChatInfoPan() {
                this.showUserConfig = {}
                this.$emit('close', null)
            },

            /**
             * 发起聊天
             */
            startChat(info: any) {
                // 如果是自己的话就忽略
                if (info.user_id != runtimeData.loginInfo.uin) {

                    // 检查这个人是不是好友
                    let chat = runtimeData.userList.find(
                        (item: UserFriendElem & UserGroupElem) => {
                            return item.user_id == info.user_id
                        },
                    )
                    if (!chat) {
                        // 创建一个临时聊天
                        const user = {
                            user_id: info.user_id,
                            // 因为临时消息没有返回昵称
                            nickname:
                                app.config.globalProperties.$t('临时会话'),
                            remark: info.user_id,
                            group_id: info.group_id,
                            group_name: '',
                        } as UserFriendElem & UserGroupElem
                        chat = user
                    }
                    runtimeData.baseOnMsgList.set(Number(info.user_id), chat)
                    // 切换到这个聊天
                    this.$nextTick(() => {
                        if (chat) {
                            const item = document.getElementById(
                                'user-' + chat.user_id,
                            )
                            if (item) {
                                item.click()
                            }
                        }
                    })
                }
            },

            openMoreConfig(id: number) {
                const info = this.chat.info.group_members.find(
                    (item) => item.user_id === id,
                )
                if(info) this.moreConfig(info)
            },
            moreConfig(info: any) {
                if(this.canEditMember(info.role)) {
                    this.showUserConfig = info
                    this.showUserConfigRaw = JSON.parse(JSON.stringify(info))
                    // 初始化一些内容
                    this.mumberInfo.banMin = this.getBanTimeMin(info.shut_up_timestamp)
                } else {
                    this.copyText(info.user_id)
                }
            },

            searchList(event: Event) {
                const value = (event.target as HTMLInputElement).value
                if (value !== '') {
                    this.number_cache = toRaw(this.chat.info.group_members)
                    this.number_cache = this.number_cache.filter((item) => {
                        const name =
                            item.card.toLowerCase() +
                            '(' +
                            item.nickname.toLowerCase() +
                            ')'
                        const id = item.user_id
                        return (
                            name.indexOf(value.toLowerCase()) != -1 ||
                            id.toString() === value
                        )
                    })
                } else {
                    this.number_cache = [] as any[]
                }
            },

            canEditMember(role: string) {
                return (
                    this.chat.info.me_info.role === 'owner' ||
                    (this.chat.info.me_info.role === 'admin'
                     && role !== 'owner') // 管理员不能编辑群主
                )
            }
        },
    })
</script>

<style scoped>
    .search-view {
        background: transparent !important;
        margin-top: -10px;
    }
    .search-view > input {
        background: var(--color-card-1);
        border-radius: 7px;
        margin: 0 -10px;
        padding: 0 10px;
        height: 35px;
        width: 100%;
        border: 0;
    }
</style>
