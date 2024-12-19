//
//  LANScanner.swift
//  Pods
//
//  Created by 林小槐 on 2024/12/12.
//

import Foundation
import Network
import os

@available(iOS 14.0, *)
class LANScanner {
    var onEvent: ((String, String) -> Void)

    private let logger = Logger()
    private let portList = [3001, 5700]

    init(onEvent: @escaping (String, String) -> Void) {
        self.onEvent = onEvent
    }

    // 获取当前设备的 IP 地址和子网掩码
    private func getCurrentNetworkInfo() -> (ipAddress: String, subnetMask: String)? {
        var addresses = [String: String]()

        var ifaddr: UnsafeMutablePointer<ifaddrs>? = nil
        guard getifaddrs(&ifaddr) == 0, let firstAddr = ifaddr else {
            return nil
        }
        defer { freeifaddrs(ifaddr) }

        for ptr in sequence(first: firstAddr, next: { $0.pointee.ifa_next }) {
            let interface = ptr.pointee
            let addrFamily = interface.ifa_addr.pointee.sa_family
            if addrFamily == UInt8(AF_INET) || addrFamily == UInt8(AF_INET6) {
                let name = String(cString: interface.ifa_name)
                if name == "en0" { // Wi-Fi 网络
                    let addr = interface.ifa_addr.pointee
                    let mask = interface.ifa_netmask.pointee
                    let ipAddr = withUnsafePointer(to: addr) { ptr in
                        ptr.withMemoryRebound(to: sockaddr_in.self, capacity: 1) { $0.pointee.sin_addr }
                    }
                    let maskAddr = withUnsafePointer(to: mask) { ptr in
                        ptr.withMemoryRebound(to: sockaddr_in.self, capacity: 1) { $0.pointee.sin_addr }
                    }
                    let ip = String(cString: inet_ntoa(ipAddr))
                    let subnet = String(cString: inet_ntoa(maskAddr))
                    addresses["ip"] = ip
                    addresses["subnet"] = subnet
                }
            }
        }

        if let ip = addresses["ip"], let subnet = addresses["subnet"] {
            return (ip, subnet)
        }
        return nil
    }

    // 根据 IP 和子网掩码计算局域网地址范围，并检查范围大小
    private func calculateLANRange(ipAddress: String, subnetMask: String) -> [String]? {
        func ipToUInt32(_ ip: String) -> UInt32 {
            let components = ip.split(separator: ".").compactMap { UInt32($0) }
            return (components[0] << 24) | (components[1] << 16) | (components[2] << 8) | components[3]
        }

        func uint32ToIP(_ value: UInt32) -> String {
            return "\(value >> 24 & 0xFF).\(value >> 16 & 0xFF).\(value >> 8 & 0xFF).\(value & 0xFF)"
        }

        let ip = ipToUInt32(ipAddress)
        let mask = ipToUInt32(subnetMask)
        let network = ip & mask
        let broadcast = network | ~mask

        var range = [String]()
        for addr in (network + 1)..<broadcast { // 排除网络地址和广播地址
            range.append(uint32ToIP(addr))
        }

        // 检查地址范围大小，若大于阈值则放弃
        if range.count > 1000 {
            logger.error("局域网范围过大，跳过扫描。")
            return nil
        }

        return range
    }

    // 检查特定端口是否开放
    private func checkPortAsync(host: String, port: UInt16, timeout: TimeInterval = 1.0) async -> Bool {
        guard let url = URL(string: "http://\(host):\(port)") else { return false }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("websocket", forHTTPHeaderField: "Upgrade")
        request.setValue("Upgrade", forHTTPHeaderField: "Connection")
        request.timeoutInterval = timeout

        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if let httpResponse = response as? HTTPURLResponse {
                logger.debug("连接：\(host):\(port) 成功，代码：\(httpResponse.statusCode)")
                return true
            }
        } catch {
            logger.debug("连接：\(host):\(port) 失败")
            return false
        }
        return false
    }

    // 扫描当前局域网端口
    func scanCurrentLAN() async {
        logger.info("开始扫描局域网中的设备...")

        guard let networkInfo = getCurrentNetworkInfo() else {
            logger.error("获取网络信息失败。")
            return
        }

        let ipAddress = networkInfo.ipAddress
        let subnetMask = networkInfo.subnetMask
        logger.debug("当前 IP：\(ipAddress)，子网掩码：\(subnetMask)")

        guard let lanRange = calculateLANRange(ipAddress: ipAddress, subnetMask: subnetMask) else {
            return
        }

        logger.info("正在扫描局域网中的 \(lanRange.count) 个设备...")

        await withTaskGroup(of: (String, Int, Bool).self) { group in
            for address in lanRange {
                for port in portList {
                    group.addTask {
                        let isOpen = await self.checkPortAsync(host: address, port: UInt16(port))
                        return (address, port, isOpen)
                    }
                }
            }

            for await (address, port, isOpen) in group {
                if isOpen {
                    logger.info("发现开放端口：\(address):\(port)")
                    let data = try! JSONSerialization.data(
                        withJSONObject: [
                            "address": address,
                            "port": port
                            ], options: [])
                    onEvent("onServiceFound", String(data: data, encoding: .utf8)!)
                }
            }
        }
        logger.info("扫描完成。")
    }
}
