#!/usr/bin/env node

import semver from 'semver'
import Logger from 'log4js'
import request from 'request'
import unzipper from 'unzipper'
import fs from 'fs'

// 日志配置
const logger = Logger.getLogger('update')
logger.level = 'info'


export function checkUpdate(nowVersion: string) {
    // 检查本体版本
    fetch('https://api.github.com/repos/Stapxs/Stapxs-QQ-Lite-2.0/releases/latest')
        .then(res => res.json())
        .then(json => {
            const version = json.tag_name.slice(1)
            logger.info(`Stapxs QQ Lite 当前版本: ${version}, 本地版本: ${nowVersion}`)
            if (semver.lt(nowVersion, version)) {
                // 本地版本小于线上版本, 需要更新
                logger.info('发现新版本, 正在更新...')
                logger.info(`运行路径: ${process.cwd()}`)
                // 下载新版本
                const assetList = json.assets
                assetList.forEach(asset => {
                    const name = asset.name
                    // 寻找结尾为 -web.zip 的文件
                    if (name.endsWith('-web.zip')) {
                        // 删除 dist 文件夹
                        if(fs.existsSync('./dist')) {
                            fs.rm('./dist', { recursive: true }, err => {
                                if (err) {
                                    logger.error(`删除 dist 文件夹失败: ${err}`)
                                }
                            }
                            )
                        }
                        const downloadUrl = asset.browser_download_url
                        logger.info(`下载地址: ${downloadUrl}`)
                        // 下载文件并解压
                        request(downloadUrl).pipe(unzipper.Extract({ path: './' }))
                        .on('close', () => {
                            logger.info('更新完成')
                            // 保存版本缓存
                            fs.writeFile('./dist/package.json', JSON.stringify({
                                version: version
                            }), err => {
                                if (err) {
                                    logger.error(`保存版本缓存失败: ${err}`)
                                }
                            })
                        })
                    }
                })
            } else {
                logger.info('当前已是最新版本')
            }
        })
        .catch(err => {
            logger.error(`检查更新失败: ${err}`)
        })
}