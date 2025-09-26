import Foundation
import Capacitor
import os

/**
 * https://capacitorjs.com/docs/plugins/ios
 */
@available(iOS 14.0, *)
@objc(OnebotPlugin)
public class OnebotPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OnebotPlugin"
    public let jsName = "Onebot"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "connect", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "send", returnType: CAPPluginReturnPromise),

        CAPPluginMethod(name: "findService", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "changeIcon", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getUsedIcon", returnType: CAPPluginReturnPromise),

        CAPPluginMethod(name: "getRelease", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSystemInfo", returnType: CAPPluginReturnPromise),

        CAPPluginMethod(name: "getFinalRedirectUrl", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getHtml", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getApi", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = Onebot()
    private let logger = Logger()

    override public func load() {
        super.load()
        logger.info(" _____ _____ _____ _____ __ __  ")
        logger.info("|   __|_   _|  _  |  _  |  |  | ")
        logger.info("|__   | | | |     |   __|-   -| ")
        logger.info("|_____| |_| |__|__|__|  |__|__| CopyRight © Stapx Steve")
        logger.info("=======================================================")
        logger.info("Capacitor Onebot 基础连接器加载完成")
        logger.info("当前执行平台：iOS / iPadOS")
        logger.info("** 此插件 swift 版本代码 95% 由 Github Copilot 及 OpenAI ChatGPT 4o 生成 **")

        // 注册 implementation 的 onEvent 回调，需要判断下有没有注册过
        if implementation.onEvent == nil {
            implementation.onEvent = { type, data in
                self.notifyListeners("onebot:event", data: [ "type": type, "data": data ])
            }
        }
    }

    @objc func connect(_ call: CAPPluginCall) {
        let url = call.getString("url") ?? ""
        call.resolve([
            "success": implementation.connect(url)
        ])
    }

    @objc func close(_ call: CAPPluginCall) {
        call.resolve([
            "success": implementation.close()
        ])
    }

    @objc func send(_ call: CAPPluginCall) {
        let data = call.getString("data") ?? ""
        call.resolve([
            "success": implementation.send(data)
        ])
    }

    @objc func findService(_ call: CAPPluginCall) {
        call.resolve([
            "success": implementation.findService()
        ])
    }

    @objc func changeIcon(_ call: CAPPluginCall) {
        let name = call.getString("name") ?? ""
        call.resolve([
            "success": implementation.changeIcon(name)
        ])
    }

    @objc func getUsedIcon(_ call: CAPPluginCall) {
        call.resolve([
            "success": implementation.getUsedIcon({ name in
                self.notifyListeners("onebot:icon", data: [ "name": name ])
            })
        ])
    }

    @objc func getRelease(_ call: CAPPluginCall) {
        // 获取操作系统版本
        let systemVersion = ProcessInfo.processInfo.operatingSystemVersion
        let versionString = "\(systemVersion.majorVersion).\(systemVersion.minorVersion).\(systemVersion.patchVersion)"
        let isIPad = UIDevice.current.userInterfaceIdiom == .pad
        let osType = isIPad ? "iPadOS" : "iOS"
        let osInfo = "\(osType) \(versionString)"
        // 获取设备架构
        var arch = "Unknown"
        #if arch(x86_64)
        arch = "x86_64"
        #elseif arch(arm64)
        arch = "arm64"
        #elseif arch(i386)
        arch = "i386"
        #elseif arch(arm)
        arch = "arm"
        #endif
        call.resolve(["release": osInfo, "arch": arch])
    }

    @objc func getSystemInfo(_ call: CAPPluginCall) {
        if let capacitorBundle = Bundle(identifier: "io.ionic.Capacitor") {
            if let version = capacitorBundle.infoDictionary?["CFBundleShortVersionString"] as? String {
                call.resolve(["success": version])
            }
        }
    }

    @objc func getFinalRedirectUrl(_ call: CAPPluginCall) {
        let url = call.getString("data") ?? ""
        let httpUtil = HTTPUtil()
        let initialURL = URL(string: url)!
        httpUtil.getFinalRedirectedURL(for: initialURL) { finalURL in
            if let finalURL = finalURL {
                call.resolve(["url": finalURL.absoluteString])
            } else {
                print("无法获取重定向 URL")
                call.resolve(["url": url])
            }
        }
    }

    @objc func getHtml(_ call: CAPPluginCall) {
        let urlGet = call.getString("data") ?? ""
        let httpUtil = HTTPUtil()
        let url = URL(string: urlGet)!
        httpUtil.fetchContent(from: url, expectedMimeType: "text/html") { content in
            if let html = content {
                call.resolve(["data": html])
            } else {
                print("请求失败")
            }
        }
    }

    @objc func getApi(_ call: CAPPluginCall) {
        let urlGet = call.getString("data") ?? ""
        let httpUtil = HTTPUtil()
        let url = URL(string: urlGet)!
        httpUtil.fetchContent(from: url, expectedMimeType: "application/json") { content in
            if let json = content {
                if let data = json.data(using: .utf8),
                   let jsonObject = try? JSONSerialization.jsonObject(with: data, options: []),
                   let dict = jsonObject as? [String: Any] {
                    call.resolve(dict)
                } else {
                    call.reject("无效 JSON 数据")
                }
            } else {
                print("请求失败")
            }
        }
    }
}
