#!/usr/bin/env node

import * as path from 'path'
import * as http from 'http'
import * as fs from 'fs'
import Logger from 'log4js'

import { checkUpdate } from './update'

// 日志配置
const logger = Logger.getLogger('index')
logger.level = 'info'

let hostname
let port

// 获取输入参数
// 参数包括 hostname、port 和 help
const argv = process.argv.slice(2).reduce((acc, cur) => {
    const [key, value] = cur.split('=')
    acc[key] = value || true
    return acc
}, {})
if(argv['hostname']) {
    hostname = argv['hostname']
}
if(argv['port']) {
    port = argv['port']
}
if(argv['help'] || !hostname || !port) {
    // eslint-disable-next-line no-console
    console.log(`
        Stapxs QQ Lite 网页服务工具：
            --hostname  指定服务运行的主机名
            --port      指定服务运行的端口
            --help      查看帮助

        主仓库：https://github.com/Stapxs/Stapxs-QQ-Lite-2.0
        网页服务工具：https://www.npmjs.com/package/ssqq-web

        ** 欢迎 star 项目，如果有问题请在主仓库提 issue **
    `)
    process.exit(0)
}

logger.info('正在初始化...')

if(!argv['skip-update']) {
    let localVersion = '0.0.1'
    // 检查是否存在 dist 文件夹
    if (fs.existsSync('./dist')) {
        try {
            // 获取文件夹中的 package.json
            const packageJson = fs.readFileSync('./dist/package.json', 'utf-8')
            localVersion = JSON.parse(packageJson).version
            logger.info(`本地版本号为: ${localVersion}`)
        } catch (err) {
            logger.error(`读取 package.json 失败: ${err}`)
        }
    }

    // 检查更新
    checkUpdate(localVersion)
}

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
}
// 创建服务
const server = http.createServer((req, res) => {
    let filePath = `./dist${req.url}`
    if (req.url === '/') {
        filePath = './dist/index.html'
    }

    const ext = path.extname(filePath)
    const contentType = mimeTypes[ext] || 'application/octet-stream'

    fs.readFile(filePath, (err, data) => {
        if (err) {
            logger.error(`读取 ${filePath} 失败: ${err.message}`)
            res.statusCode = 404
            res.setHeader('Content-Type', 'text/plain')
            res.end('404 Not Found')
        } else {
            res.statusCode = 200
            res.setHeader('Content-Type', contentType)
            res.end(data)
        }
    })
})

server.listen(port, hostname, () => {
    logger.info(`服务于 http://${hostname}:${port} 运行`)
})
