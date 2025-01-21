import child_process from 'child_process'
import axios from 'axios'
import { logLevel } from '../index.ts'
import log4js from 'log4js'

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

export const linkView = {
    async bilibili(url: string) {
        logger.level = logLevel
        if(!url.includes('bilibili.com')) {
            // 获取最终重定向地址并处理
            const finalUrl = await this.getFinalRedirectUrl(url)
            if(finalUrl) {
                return await this.getBilibiliPreView(finalUrl)
            }
            return null
        }
        return await this.getBilibiliPreView(url)
    },

    async getBilibiliPreView(url: string) {
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

    async getFinalRedirectUrl(initialUrl: string) {
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
}
