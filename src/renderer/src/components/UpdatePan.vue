<template>
    <div class="update-info" :class="{ 'multiple-releases': releases && releases.length > 0 }">
        <template v-if="!releases || releases.length === 0">
            <span>{{ updated ? $t('更新记录') : $t('新版本') }}</span>
            <a>{{ version }}</a>
            <div class="title">
                <img :src="user.avatar">
                <a :href="user.url">{{ user.name }}</a>
                <span>
                    {{
                        Intl.DateTimeFormat(getTrueLang(), {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        }).format(new Date(date))
                    }}
                </span>
            </div>
            <div class="info">
                <span>{{ info.title }}</span>
                <div>
                    <div v-for="(item, index) in info.content"
                        :key="'changelog-' + index">
                        <span>{{ item.text }}</span>
                        <div v-if="item.issue"
                            class="log-issue">
                            <span> -&gt; </span>
                            <div />
                            <a @click="openLink(`https://github.com/${repoName}/issues/${item.issue}`, true)">#{{ item.issue }}</a>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template v-else>
            <div v-for="(release, releaseIndex) in releaseList" :key="'release-' + releaseIndex" class="release-item">
                <div class="release-header">
                    <a class="release-version">{{ release.version }} - {{ release.info.title.replace('Release', '') }}</a>
                    <div class="release-meta">
                        <img :src="release.user.avatar">
                        <a :href="release.user.url" target="_blank">{{ release.user.name }}</a>
                        <span>
                            {{
                                Intl.DateTimeFormat(getTrueLang(), {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                }).format(new Date(release.date))
                            }}
                        </span>
                    </div>
                </div>
                <hr>
                <div class="info">
                    <div>
                        <div v-for="(item, index) in release.info.content"
                            :key="'changelog-' + releaseIndex + '-' + index">
                            <span>{{ item.text }}</span>
                            <div v-if="item.issue"
                                class="log-issue">
                                <span> -&gt; </span>
                                <div />
                                <a @click="openLink(`https://github.com/${repoName}/issues/${item.issue}`, true)">#{{ item.issue }}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue'
    import {
        getTrueLang,
        gitmojiToEmoji,
    } from '@renderer/function/utils/systemUtil'
    import { openLink } from '@renderer/function/utils/appUtil'

    export default defineComponent({
        name: 'UpdatePan',
        props: ['version', 'date', 'user', 'message', 'updated', 'releases'],
        data() {
            return {
                openLink,
                getTrueLang,
                repoName: import.meta.env.VITE_APP_REPO_NAME,
                info: {
                    title: '' as string,
                    content: [] as { [key: string]: string }[],
                },
                releaseList: [] as any[],
            }
        },
        mounted() {
            // 如果是多条记录模式
            if (this.releases && this.releases.length > 0) {
                this.releaseList = this.releases.map((release: any) => {
                    const parsedInfo = this.parseMessage(release.message)
                    return {
                        version: release.version,
                        date: release.date,
                        user: release.user,
                        info: parsedInfo,
                        html_url: release.html_url,
                    }
                })
            } else {
                // 单条记录模式（原有逻辑）
                this.info = this.parseMessage(this.message)
            }
        },
        methods: {
            parseMessage(message: string) {
                let msg = message
                // 处理 title，取开头到下一个 "\r\n" 之间的内容
                const title = msg.split('\r\n')[0].substring(1)
                // 处理 msg，取 "## 更新内容" 到下一个 "##" 之间的内容
                const start = msg.indexOf('## 更新内容\r\n')
                if (start != -1) {
                    msg = msg.substring(start + 9)
                    const end = msg.indexOf('##')
                    if (end != -1) {
                        msg = msg.substring(0, end)
                    }
                }
                msg = title + '\r\n' + msg

                const updateInfo = msg.split('\n')
                const info = {
                    title: updateInfo[0],
                    content: [] as { [key: string]: string }[],
                }

                for (let i = 1; i < updateInfo.length; i++) {
                    const item = { text: '' } as { [key: string]: string }
                    let text = updateInfo[i]
                    if (text.startsWith(':')) {
                        const end = text.substring(1).indexOf(':')
                        const name = text.substring(0, end + 2)
                        const emj = gitmojiToEmoji(name)
                        if (emj != undefined) {
                            text = text.replace(name, emj)
                        }
                    }
                    // 匹配 issue 编号
                    const regexIssue = /<- #(\d+)/
                    const matchIssue = text.match(regexIssue)
                    if (matchIssue) {
                        const issueId = matchIssue[1]
                        text = text.replace(regexIssue, '') // 删除 issue 编号
                        item.issue = issueId
                    }
                    const regexHash = /[a-f0-9]{40}/
                    const matchHash = text.match(regexHash)
                    if (matchHash) {
                        const hash = matchHash[0]
                        // 保留前 7 位
                        text = text.replace(hash, hash.substring(0, 7))
                    }
                    item.text = text
                    info.content.push(item)
                }

                return info
            }
        }
    })
</script>

<style scoped>
    .log-issue {
        cursor: pointer;
        display: inline-flex;
        flex-direction: row;
        align-items: center;
    }
    .log-issue > div {
        width: calc(0.8rem - 6px);
        height: calc(0.8rem - 6px);
        border-radius: 100%;
        outline: 3px solid var(--color-issue-close);
        margin: 0 5px;
    }
    .log-issue > a {
        text-decoration: underline;
        color: var(--color-issue-close);
    }

    /* 多条更新记录样式 */
    .update-info.multiple-releases {
        margin: 5px 0 0 -10px;
        max-height: 55vh;
        overflow-y: auto;
    }

    .release-item {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--color-card-2);
        background: var(--color-card);
        border-radius: 7px;
        padding: 10px;
    }

    .release-item hr {
        border: none;
        border-top: 1px solid var(--color-main);
        margin: 0 0 10px 0;
    }

    .release-item span {
        line-height: 1.5;
    }

    .release-item:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }

    .release-header {
        margin: -10px -10px 0 -10px;
        border-radius: 7px 7px 0 0;
        padding: 10px;
    }

    .release-version {
        font-size: 1.2rem;
        font-weight: bold;
        display: block;
        margin-bottom: 5px;
        color: var(--color-font);
    }

    .release-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        color: var(--color-font-2);
    }

    .release-meta img {
        width: 20px;
        height: 20px;
        border-radius: 50%;
    }

    .release-meta a {
        color: var(--color-main);
        text-decoration: none;
    }

    .release-meta a:hover {
        text-decoration: underline;
    }
</style>
