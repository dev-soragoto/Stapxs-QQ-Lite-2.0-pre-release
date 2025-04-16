import child_process from 'child_process'
import log4js from 'log4js'
import jp from 'jsonpath'
import axios from 'axios'

import { logLevel } from '../index.ts'

const logger = log4js.getLogger('util')

export function queryKeys(keyPath: string, value: string) {
    return new Promise((resolve, reject) => {
        try {
            child_process.exec(
                `reg query ${keyPath} /v ${value}`,
                (error, stdout, stderr) => {
                    if (error) {
                        reject(error)
                        return
                    }
                    resolve({ stdout, stderr })
                },
            )
        } catch (error) {
            reject(error)
        }
    }) as Promise<{ stdout: any; stderr: any }>
}

export function runCommand(command: string) {
    return new Promise((resolve, reject) => {
        try {
            child_process.exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error)
                    return
                }
                resolve({ stdout, stderr })
            })
        } catch (error) {
            reject(error)
        }
    }) as Promise<{ stdout: any; stderr: any }>
}

async function getFinalRedirectUrl(initialUrl: string) {
    try {
        const url = new URL(initialUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
            return null;
        }
        if (initialUrl.length > 2000) {
            return null;
        }
        const MAX_REDIRECTS = 10;
        const response = await axios.get(url.toString(), {
            maxRedirects: MAX_REDIRECTS,
            validateStatus: (status) => status < 400
        })
        return response.request.res.responseUrl
    } catch (error) {
        return null
    }
}

export const linkView = {
    async bilibili(url: string, retry = false) {
        logger.level = logLevel
        if(!url.includes('bilibili.com')) {
            // 获取最终重定向地址并处理
            const finalUrl = await getFinalRedirectUrl(url)
            logger.info(`[linkView] 获取到 bilibili 链接：${finalUrl}`)
            if(finalUrl && !retry) {
                return await linkView.bilibili(finalUrl, true)
            }
            return null
        }
        const previewAPI = 'https://api.bilibili.com/x/web-interface/wbi/view?bvid='
        const match = url.match(/bilibili.com\/video\/(BV[0-9a-zA-Z]+)/)
        if (match) {
            const bvid = match[1]
            logger.info(`[linkView] 获取到 bilibili 链接：${bvid}`)
            try {
                const response = await axios.get(previewAPI + bvid)
                const { data } = response
                if (data.code === 0) {
                    logger.info(`[linkView] 预览 bilibili 链接成功：${data.data.title}`)
                    return {
                        type: 'bilibili',
                        sub_type: 'video',
                        data: {
                            title: data.data.title,
                            desc: data.data.desc,
                            pic: data.data.pic,
                            public: data.data.pubdate,
                            owner: data.data.owner,
                            stat: data.data.stat
                        }
                    }
                }
            } catch (error) {
                logger.error('[linkView] 预览 bilibili 链接失败：', error)
            }
        }
        return null
    },

    async music163(url: string, retry = false) {
        logger.level = logLevel
        // 拆分 get 参数
        const urlObj = new URL(url)
        const params = new URLSearchParams(urlObj.search)
        const id = params.get('id')
        if (id == null) {
            const finalUrl = await getFinalRedirectUrl(url)
            logger.info(`[linkView] 获取到网易云音乐链接：${finalUrl}`)
            if(finalUrl && !retry) {
                return await linkView.music163(finalUrl, true)
            }
        } else {
            logger.info(`[linkView] 获取获取网易云音乐歌曲 ID：${id}`)
            const baseUrl = import.meta.env.VITE_APP_163_MUSIC_API
            try {
                const responseDetail = await axios.get(baseUrl + '/song/detail?ids=' + id, { timeout: 10000 })
                const responseUrl = await axios.get(baseUrl + '/song/url?id=' + id, { timeout: 10000 })
                const responseComment = await axios.get(baseUrl + '/comment/music?id=' + id + '&limit=3', { timeout: 10000 })

                const getData = {
                    detail: responseDetail.data,
                    url: responseUrl.data,
                    comment: responseComment.data
                }
                const finalData = {
                    type: 'music163',
                    sub_type: 'song',
                    data: {
                        play_link: jp.query(getData['url'], '$..url')[0],
                        cover: jp.query(getData['detail'], '$..al.picUrl')[0],
                        info: {
                            name: jp.query(getData['detail'], '$..name')[0],
                            author: jp.query(getData['detail'], '$..ar[*].name'),
                        },
                        // 列表，获取所有的
                        comment: {
                            name: jp.query(getData['comment'], '$..nickname'),
                            content: jp.query(getData['comment'], '$..content'),
                            time: jp.query(getData['comment'], '$..time'),
                            like: jp.query(getData['comment'], '$..likedCount'),
                            reply: jp.query(getData['comment'], '$..replyCount'),
                        }
                    }
                }
                logger.info('[linkView] 预览网易云音乐成功')
                return finalData
            } catch (error) {
                logger.error('[linkView] 预览网易云音乐失败：', error)
            }
        }
        return null
    }
}
