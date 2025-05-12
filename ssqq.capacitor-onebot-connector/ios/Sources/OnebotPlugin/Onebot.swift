import Foundation
import Network
import os

@available(iOS 14.0, *)
@objc public class Onebot: NSObject {

    // 需要返回 type 和 data 两个字段
    var onEvent: ((String, String) -> Void)?
    var onOptionEvent: ((String, String) -> Void)?

    private var client: WebSocketClient?

    @objc public func connect(_ url: String) {

        let url = URL(string: url)!
        if(client != nil) {
            client?.disconnect()
        }
        // 使用 GCD 创建 WebSocket 连接
        DispatchQueue.global().async {
            let client = WebSocketClient(url: url, onEvent: { type, data in
                if let onEvent = self.onEvent {
                    onEvent(type, data)
                }
            })
            client.connect()
            // 全局保存 client 对象，避免被销毁
            self.client = client
        }
    }

    @objc public func send(_ data: String) {
        client?.sendMessage(data)
    }

    @objc public func close() {
        client?.disconnect()
    }

    @objc public func findService() {
        DispatchQueue.global().async {
            Task {
                let lanScanner = LANScanner(onEvent: { type, data in
                if let onEvent = self.onEvent {
                    onEvent(type, data)
                }
            })
                await lanScanner.scanCurrentLAN()
            }
        }
    }

    @objc public func changeIcon(_ name: String) {
        DispatchQueue.main.async {
            let logger = Logger()
            logger.debug("更新图标名：\(name)")
            if UIApplication.shared.supportsAlternateIcons {
                UIApplication.shared.setAlternateIconName(name.isEmpty ? nil : name) { error in
                    if let error = error {
                        logger.error("更新图标失败：\(error.localizedDescription)")
                    }
                }
            }
        }
    }

    @objc public func getUsedIcon(_ send: @escaping ((String) -> Void)) {
        DispatchQueue.main.async {
            send(UIApplication.shared.alternateIconName ?? "")
        }
    }
}
