<!--
 * @FileDescription: 联系人 / 消息列表项模板
 * @Author: Stapxs
 * @Date: 2022/08/14
 * @Version: 1.0
-->

<template>
    <div
        :id="'user-' + (data.user_id ?? data.group_id)"
        :class="'friend-body' + (select ? ' active' : menu ? ' onmenu' : '')"
        :data-name="data.user_id ? data.nickname : data.group_name"
        :data-nickname="data.user_id ? data.nickname : ''"
        :data-type="data.user_id ? 'friend' : 'group'">
        <div :class="data.new_msg === true ? 'new' : ''" />
        <font-awesome-icon
            v-if="data.user_id == -10000"
            :icon="['fas', 'bell']" />
        <img
            v-else
            loading="lazy"
            :title="getShowName()"
            :src="
                data.user_id
                    ? 'https://q1.qlogo.cn/g?b=qq&s=0&nk=' + data.user_id
                    : 'https://p.qlogo.cn/gh/' +
                        data.group_id +
                        '/' +
                        data.group_id +
                        '/0'
            ">
        <div>
            <div>
                <p>{{ getShowName() }}</p>
                <div style="flex: 1" />
                <a
                    v-if="from == 'message'"
                    class="time">{{
                    data.time !== undefined
                        ? Intl.DateTimeFormat(trueLang, {
                            hour: 'numeric',
                            minute: 'numeric',
                        }).format(new Date(data.time))
                        : ''
                }}</a>
            </div>
            <div>
                <a :class="from == 'friend' ? 'nick' : ''">{{
                    from == 'friend' ? (data.longNick ?? '') : data.raw_msg
                }}</a>
                <div
                    v-if="from == 'message'"
                    style="margin-left: 10px; display: flex">
                    <font-awesome-icon
                        v-if="data.always_top === true"
                        :icon="['fas', 'thumbtack']" />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue'
    import { getTrueLang } from '@renderer/function/utils/systemUtil'

    export default defineComponent({
        name: 'FriendBody',
        props: ['data', 'select', 'menu', 'from'],
        data() {
            return {
                trueLang: getTrueLang(),
            }
        },
        methods: {
            getShowName() {
                const group = this.data.group_name
                const remark = this.data.remark
                const nickname = this.data.nickname
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
