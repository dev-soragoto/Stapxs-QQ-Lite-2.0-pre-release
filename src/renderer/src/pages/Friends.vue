<!--
 * @FileDescription: 联系人列表页面
 * @Author: Stapxs
 * @Date:
 *      2022/08/14
 *      2022/12/12
 * @Version:
 *      1.0 - 初始版本
 *      1.5 - 重构为 ts 版本，代码格式优化
-->

<template>
    <div class="friend-view">
        <div
            id="friend-list"
            :class="
                'friend-list' + (runtimeData.tags.openSideBar ? ' open' : '')
            ">
            <div>
                <div class="base">
                    <span>{{ $t('联系人') }}</span>
                    <div style="flex: 1" />
                    <font-awesome-icon
                        :icon="['fas', 'rotate-right']"
                        @click="reloadUser" />
                </div>
                <div
                    id="friend-small-search"
                    class="small">
                    <label>
                        <input
                            id="friend-search-small"
                            v-model="searchInfo"
                            type="text"
                            :placeholder="$t('搜索 ……')"
                            @input="search">
                        <font-awesome-icon
                            :icon="['fas', 'magnifying-glass']" />
                    </label>
                    <div
                        class="reload"
                        @click="reloadUser">
                        <font-awesome-icon :icon="['fas', 'rotate-right']" />
                    </div>
                    <div @click="openLeftBar">
                        <font-awesome-icon :icon="['fas', 'bars-staggered']" />
                    </div>
                </div>
                <label>
                    <input
                        id="friend-search"
                        v-model="searchInfo"
                        type="text"
                        :placeholder="$t('搜索 ……')"
                        @input="search">
                    <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
                </label>
            </div>
            <div :class="runtimeData.tags.openSideBar ? 'open' : ''">
                <template v-if="runtimeData.showList.length <= 0">
                    <template v-if="runtimeData.tags.classes.length > 0">
                        <template
                            v-for="info in runtimeData.tags.classes"
                            :key="'class-' + info.class_id">
                            <div
                                :class="
                                    'list exp-body' +
                                        (classStatus[info.class_id] == true
                                            ? ' open'
                                            : '')
                                ">
                                <header
                                    :title="info.class_name"
                                    :class="
                                        'exp-header' +
                                            (runtimeData.tags.openSideBar
                                                ? ' open'
                                                : '')
                                    "
                                    @click="classClick(info.class_id)">
                                    <div />
                                    <span>{{ info.class_name }}</span>
                                    <a>{{
                                        info.user_count ??
                                            runtimeData.userList.filter((get) => {
                                                return get.class_id == info.class_id
                                            }).length
                                    }}</a>
                                </header>
                                <div :id="'class-' + info.class_id">
                                    <FriendBody
                                        v-for="item in runtimeData.userList.filter(
                                            (get) => {
                                                return (
                                                    get.class_id ==
                                                    info.class_id
                                                )
                                            },
                                        )"
                                        :key="
                                            'fb-' +
                                                (item.user_id
                                                    ? item.user_id
                                                    : item.group_id)
                                        "
                                        :data="item"
                                        from="friend"
                                        @click="userClick(item, $event)" />
                                </div>
                            </div>
                        </template>
                        <div
                            :class="
                                'list exp-body' +
                                    (classStatus['-1'] == true ? ' open' : '')
                            ">
                            <header
                                :title="$t('群组')"
                                :class="
                                    'exp-header' +
                                        (runtimeData.tags.openSideBar
                                            ? ' open'
                                            : '')
                                "
                                @click="classClick('-1')">
                                <div />
                                <span>{{ $t('群组') }}</span>
                                <a>{{
                                    runtimeData.userList.filter((get) => {
                                        return get.class_id == undefined
                                    }).length
                                }}</a>
                            </header>
                            <div>
                                <FriendBody
                                    v-for="item in runtimeData.userList.filter(
                                        (get) => {
                                            return get.class_id == undefined
                                        },
                                    )"
                                    :key="
                                        'fb-' +
                                            (item.user_id
                                                ? item.user_id
                                                : item.group_id)
                                    "
                                    :data="item"
                                    from="friend"
                                    @click="userClick(item, $event)" />
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <FriendBody
                            v-for="item in runtimeData.userList"
                            :key="
                                'fb-' +
                                    (item.user_id ? item.user_id : item.group_id)
                            "
                            :data="item"
                            from="friend"
                            @click="userClick(item, $event)" />
                    </template>
                </template>
                <!-- 搜索用的 -->
                <div
                    v-else
                    class="list">
                    <div>
                        <FriendBody
                            v-for="item in runtimeData.showList"
                            :key="
                                'fb-' +
                                    (item.user_id ? item.user_id : item.group_id)
                            "
                            :data="item"
                            from="friend"
                            @click="userClick(item, $event)" />
                    </div>
                </div>
            </div>
        </div>
        <div
            v-show="!loginInfo.status || runtimeData.chatInfo.show.id == 0"
            :class="
                'friend-list-space' +
                    (runtimeData.tags.openSideBar ? ' open' : '')
            ">
            <div class="ss-card">
                <font-awesome-icon :icon="['fas', 'inbox']" />
                <span>{{ $t('选择联系人开始聊天') }}</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import FriendBody from '@renderer/components/FriendBody.vue'

    import { defineComponent } from 'vue'
    import {
        BaseChatInfoElem,
        UserFriendElem,
    } from '@renderer/function/elements/information'
    import { UserGroupElem } from '@renderer/function/elements/information'

    import { runtimeData } from '@renderer/function/msg'
    import { reloadUsers } from '@renderer/function/utils/appUtil'
    import { login as loginInfo } from '@renderer/function/connect'

    export default defineComponent({
        name: 'ViewFriends',
        components: { FriendBody },
        props: ['list'],
        emits: ['userClick', 'loadHistory'],
        data() {
            return {
                runtimeData: runtimeData,
                loading: false,
                isSearch: false,
                searchInfo: '',
                classStatus: {} as { [key: string]: boolean },
                loginInfo: loginInfo,
            }
        },
        mounted() {
            // 判断 friend-small-search 是否 display none
            const smallSearch = document.getElementById('friend-small-search')
            if(smallSearch) {
                const style = window.getComputedStyle(smallSearch)
                let name = 'friend-search'
                if(style.display != 'none') {
                    name = 'friend-search-small'
                }
                // 将焦点移动到搜索框
                if(runtimeData.tags.isElectron) {
                    const search = document.getElementById(name)
                    if(search) {
                        search.focus()
                    }
                }
            }
        },
        methods: {
            /**
             * 联系人被点击事件
             * @param data 联系人信息
             * @param event 点击事件
             */
            userClick(data: UserFriendElem & UserGroupElem, event: Event) {
                const sender = event.currentTarget as HTMLDivElement
                if (this.runtimeData.tags.openSideBar) {
                    this.openLeftBar()
                }
                this.isSearch = false
                this.searchInfo = ''
                this.runtimeData.showList = [] as any[]

                const back = {
                    type: data.user_id ? 'user' : 'group',
                    id: data.user_id ? data.user_id : data.group_id,
                    name: this.getShowName(data),
                    avatar: data.user_id? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id: 'https://p.qlogo.cn/gh/' +
                          data.group_id +
                          '/' +
                          data.group_id +
                          '/0',
                    jump: sender.dataset.jump,
                } as BaseChatInfoElem
                // 更新聊天框
                this.$emit('userClick', back)
                // 查重
                const getList = runtimeData.onMsgList.filter((item) => {
                    const id = item.user_id ? item.user_id : item.group_id
                    return Number(id) === Number(back.id)
                })
                if (getList.length === 0) {
                    runtimeData.onMsgList.push(data)
                }
                // 获取历史消息
                this.$emit('loadHistory', back)
                // 切换标签卡
                const barMsg = document.getElementById('bar-msg')
                if (barMsg !== null) {
                    barMsg.click()
                }
            },

            /**
             * 列表搜索
             * @param event 输入事件
             */
            search(event: Event) {
                const value = (event.target as HTMLInputElement).value
                if (value !== '') {
                    this.isSearch = true
                    this.runtimeData.showList = this.list.filter(
                        (item: UserFriendElem & UserGroupElem) => {
                            const name = (
                                item.user_id? item.nickname + item.remark: item.group_name
                            ).toLowerCase()
                            const py = item.py_name ? item.py_name : ''
                            const id = item.user_id? item.user_id: item.group_id
                            return (
                                id.toString() === value ||
                                (value.length > 4 &&
                                    py.indexOf(value.toLowerCase()) != -1) ||
                                name.indexOf(value.toLowerCase()) != -1
                            )
                        },
                    )
                } else {
                    this.isSearch = false
                    this.runtimeData.showList = [] as any[]
                }
                // macOS: 刷新 TouchBar
                if(runtimeData.tags.isElectron) {
                    // list 只需要 id 和 name
                    runtimeData.plantform.reader?.send('sys:flushFriendSearch',
                        this.runtimeData.showList.map((item) => {
                            return {
                                id: item.user_id ? item.user_id : item.group_id,
                                name: this.getShowName(item)
                            }
                        }))
            }
            },

            /**
             * 重新加载联系人列表
             */
            reloadUser() {
                reloadUsers()
            },

            /**
             * 切换侧边栏状态
             */
            openLeftBar() {
                runtimeData.tags.openSideBar = !runtimeData.tags.openSideBar
            },

            classClick(id: string) {
                if (this.classStatus[id]) {
                    this.classStatus[id] = !this.classStatus[id]
                } else {
                    this.classStatus[id] = true
                }
            },

            getShowName(data: UserFriendElem & UserGroupElem) {
                const group = data.group_name
                const remark = data.remark
                const nickname = data.nickname
                if (group) return group
                else {
                    if (!remark || remark == nickname) {
                        return nickname
                    } else {
                        return remark + '（' + nickname + '）'
                    }
                }
            },
        },
    })
</script>

<style scoped>
    .exp-body > div {
        /* transition: transform .3s;
    transform-origin: top; */
        transform: scaleY(0);
        height: 0;
    }
    .exp-body.open > div {
        transform: scaleY(1);
        height: unset;
    }
    .exp-body > header > div {
        transition:
            margin-right 0.3s,
            transform 0.3s;
        transform: scaleY(0);
        margin-right: 0;
        width: 0;
    }
    .exp-body.open > header > div {
        transform: scaleY(1);
        margin-right: 10px;
        width: 5px;
    }

    .exp-header {
        color: var(--color-font);
        align-items: center;
        border-radius: 7px;
        cursor: pointer;
        margin: 0 10px;
        padding: 10px;
        display: flex;
    }
    .exp-header:hover {
        background: var(--color-card-2);
    }
    .exp-header > div {
        background: var(--color-main);
        margin-right: 10px;
        border-radius: 7px;
        height: 1rem;
        width: 5px;
    }
    .exp-header > span {
        flex: 1;
    }
    .exp-header > a {
        color: var(--color-font-2);
        font-size: 0.9rem;
    }

    @media (max-width: 700px) {
        .exp-header:not(.open) {
            display: none;
        }
    }
    @media (max-width: 500px) {
        .exp-header > span {
            display: block !important;
        }
    }
</style>
