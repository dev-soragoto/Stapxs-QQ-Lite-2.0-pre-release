<template>
    <div :class="'merge-pan' + (runtimeData.mergeMsgStack.length > 0 ? ' show' : '')">
        <div @click="closeMergeMsg" />
        <div class="ss-card">
            <div>
                <font-awesome-icon style="margin-top: 5px" :icon="['fas', 'message']" />
                <span>{{ $t('合并消息') }}</span>
                <font-awesome-icon v-if="stack.length <= 1" :icon="['fas', 'xmark']" @click="exitMergeMsg" />
                <font-awesome-icon v-else :icon="['fas', 'angles-left']" @click="exitMergeMsg" />
            </div>
            <div v-if="nowData === undefined">
                <!-- 无内容 -->
            </div>
            <TransitionGroup v-else :name="runtimeData.sysConfig.opt_fast_animation ? '' : 'msglist'" tag="div">
                <template v-for="(msgIndex, index) in nowData.messageList" :key="'merge-' + nowData.forwardMsg.message[0].id + '-' + index">
                    <NoticeBody v-if=" isShowTime( nowData.messageList[index - 1] ?
                                    nowData.messageList[index - 1].time : undefined, msgIndex.time, index == 0)"
                        :id="uuid()"
                        :key="'notice-time-' + index"
                        :data="{ sub_type: 'time', time: msgIndex.time }" />
                    <!-- [已删除]消息 -->
                    <NoticeBody
                        v-else-if="isDeleteMsg(msgIndex)"
                        :key="'delete-' + msgIndex.message_id"
                        :data="{ sub_type: 'delete' }" />
                    <!-- 合并转发消息忽略是不是自己的判定 -->
                    <MsgBody :data="msgIndex" :type="'merge'" />
                </template>
            </TransitionGroup>
        </div>
    </div>
</template>

<script lang="ts">
    import { v4 as uuid } from 'uuid'

    import MsgBody from '@renderer/components/MsgBody.vue'
    import NoticeBody from '@renderer/components/NoticeBody.vue'

    import { defineComponent, ref, type Ref } from 'vue';
    import { runtimeData } from '@renderer/function/msg';
    import { type MergeStackData } from '@renderer/function/elements/information';
    import { isDeleteMsg, isShowTime } from '@renderer/function/utils/msgUtil';

    export default defineComponent({
        name: 'MergePan',
        components: { NoticeBody, MsgBody },
        data() {
            const stack = runtimeData.mergeMsgStack
            const nowData: Ref<MergeStackData|undefined> = ref()
            return {
                uuid,
                runtimeData,
                stack,
                nowData,
                isShowTime,
                isDeleteMsg
            }
        },
        mounted() {
            this.$watch(
                () => runtimeData.mergeMsgStack.length,
                () => {
                    // 最后一个保留下来做展开关闭动画
                    if(this.stack.length === 0) {
                        // 清理下垃圾
                        runtimeData.mergeMessageImgList = undefined
                    }
                    else this.nowData = this.stack.at(-1)
                }
            )
            this.$watch(
                () => this.nowData?.imageList,
                () => {
                    if(runtimeData.mergeMsgStack.length === 0 || this.nowData?.imageList === undefined) return
                    runtimeData.mergeMessageImgList = this.nowData.imageList
                }
            )
        },
        methods: {
            /**
             * 退出一层合并转发弹窗
             */
            exitMergeMsg() {
                this.stack.length --
            },

            /**
             * 关闭合并转发弹窗
             */
            closeMergeMsg() {
                this.stack.length = 0
            },

            isMergeOpen() {
                return this.stack.length > 0
            }
        }
    })
</script>

<style scoped>
    /* 消息动画 */
    .msglist-move {
        transition: all 0.3s;
    }

    .msglist-enter-active {
        transition: all 0.4s;
    }

    .msglist-leave-active {
        transition: all 0.2s;
    }

    .msglist-enter-from {
        transform: translateX(-50px);
        opacity: 0;
    }

    .msglist-leave-to {
        opacity: 0;
    }
</style>
