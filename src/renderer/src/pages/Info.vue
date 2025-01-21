<!--
 * @FileDescription: 群 / 好友信息页面
 * @Author: Stapxs
 * @Date: missing
 * @Version: 1.0
-->

<template>
    <div
        v-if="tags.openChatInfo"
        class="chat-info-pan">
        <div class="ss-card chat-info">
            <header>
                <span v-if="chat.show.type === 'group'">{{
                    $t('群资料')
                }}</span>
                <span v-if="chat.show.type === 'user'">{{ $t('好友') }}</span>
                <font-awesome-icon
                    :icon="['fas', 'xmark']"
                    @click="closeChatInfoPan" />
            </header>
            <div :class="'chat-info-base ' + chat.show.type">
                <div>
                    <img :src="chat.show.avatar">
                    <div>
                        <a>{{ chat.show.name }}</a>
                        <span>{{ chat.show.id }}</span>
                    </div>
                </div>
                <div
                    v-if="chat.show.type === 'group'"
                    v-show="Object.keys(chat.info.group_info).length > 0">
                    <header>
                        <span>{{ $t('介绍') }}</span>
                    </header>
                    <span
                        v-html="
                            chat.info.group_info.gIntro === undefined ||
                                chat.info.group_info.gIntro === ''
                                ? $t('群主很懒，还没有群介绍哦～')
                                : chat.info.group_info.gIntro
                        " />
                    <div class="tags">
                        <div
                            v-for="item in chat.info.group_info.tags"
                            :key="item.md">
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
                    <span>{{ chat.info.user_info.qqLevel }}</span>
                    <header v-if="chat.info.user_info.regTime">
                        <span>{{ $t('注册时间') }}</span>
                    </header>
                    <span v-if="chat.info.user_info.regTime">{{ Intl.DateTimeFormat(trueLang, {
                        year: 'numeric'
                    }).format(
                        new Date(
                            chat.info.user_info.regTime * 1000,
                        ),
                    ) }}</span>
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
                                }).format(
                                    new Date(
                                        `${chat.info.user_info.birthday_year}-${
                                            chat.info.user_info.birthday_month}-${
                                            chat.info.user_info.birthday_day}`,
                                    ),
                                ) }}
                            </span>
                        </span>
                        <span>{{ $t('地区') }}:
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
            <BcTab
                v-if="chat.show.type === 'group'"
                class="chat-info-tab">
                <div :name="$t('成员')">
                    <div class="chat-info-tab-member">
                        <div class="search-view">
                            <input
                                :placeholder="$t('搜索 ……')"
                                @input="searchList">
                        </div>
                        <div
                            v-for="item in number_cache.length > 0
                                ? number_cache
                                : chat.info.group_members"
                            :key="'chatinfomlist-' + item.user_id"
                            @click="startChat(item)">
                            <img
                                loading="lazy"
                                :src="`https://q1.qlogo.cn/g?b=qq&s=0&nk=${item.user_id}`">
                            <div>
                                <a>{{
                                    item.card ? item.card : item.nickname
                                }}</a>
                                <font-awesome-icon
                                    v-if="item.role === 'owner'"
                                    :icon="['fas', 'crown']" />
                                <font-awesome-icon
                                    v-if="item.role === 'admin'"
                                    :icon="['fas', 'star']" />
                            </div>
                            <span>{{ item.user_id }}</span>
                        </div>
                    </div>
                </div>
                <div :name="$t('公告')">
                    <div class="bulletins">
                        <BulletinBody
                            v-for="(item, index) in chat.info.group_notices ??
                                []"
                            :key="'bulletins-' + index"
                            :data="item"
                            :index="index" />
                    </div>
                </div>
                <div :name="$t('文件')">
                    <div
                        class="group-files"
                        @scroll="fileLoad">
                        <div
                            v-for="item in chat.info.group_files.file_list"
                            :key="'file-' + item.id">
                            <FileBody
                                :chat="chat"
                                :item="item" />
                        </div>
                        <div
                            v-show="
                                chat.info.group_files !== undefined &&
                                    chat.info.group_files.next_index !==
                                    undefined &&
                                    chat.info.group_files.next_index !== 0
                            "
                            class="group-files-loader">
                            <font-awesome-icon :icon="['fas', 'ellipsis']" />
                        </div>
                    </div>
                </div>
                <div :name="$t('设置')">
                    <div style="padding: 0 20px">
                        <OptInfo
                            :type="'group'"
                            :chat="chat" />
                    </div>
                </div>
            </BcTab>
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

    import { defineComponent, toRaw } from 'vue'
    import { getTrueLang } from '@renderer/function/utils/systemUtil'
    import { runtimeData } from '@renderer/function/msg'
    import {
        UserFriendElem,
        UserGroupElem,
    } from '@renderer/function/elements/information'

    export default defineComponent({
        name: 'ViewInfo',
        components: { BulletinBody, FileBody, OptInfo, BcTab },
        props: ['tags', 'chat'],
        emits: ['close', 'loadFile'],
        data() {
            return {
                runtimeData: runtimeData,
                trueLang: getTrueLang(),
                isTop: false,
                number_cache: [] as any[],
            }
        },
        methods: {
            /**
             * 关闭面板
             */
            closeChatInfoPan() {
                this.$emit('close', null)
            },

            /**
             * 加载更多文件
             * @param event 滚动事件
             */
            fileLoad(event: Event) {
                this.$emit('loadFile', event)
            },

            /**
             * 发起聊天
             */
            startChat(info: any) {
                // 如果是自己的话就忽略
                if (info.user_id != runtimeData.loginInfo.uin) {
                    // 检查这个人是否已经在聊天列表中
                    let chat = runtimeData.onMsgList.find(
                        (item: UserFriendElem & UserGroupElem) => {
                            return item.user_id == info.user_id
                        },
                    )
                    if (!chat) {
                        // 检查这个人是不是好友
                        const friend = runtimeData.userList.find(
                            (item: UserFriendElem & UserGroupElem) => {
                                return item.user_id == info.user_id
                            },
                        )
                        if (friend) {
                            runtimeData.onMsgList.push(friend)
                            chat = friend
                        } else {
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
                            runtimeData.onMsgList.push(user)
                            chat = user
                        }
                    }
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
