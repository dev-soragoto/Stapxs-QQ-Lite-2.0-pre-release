package cn.stapxs.qqweb.connector;

import android.content.Context;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.net.DhcpInfo;
import android.util.Log;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.UnknownHostException;
import java.util.Enumeration;
import java.util.Locale;
import java.util.Objects;

public class NetworkUtils {

    // 获取当前设备的 IP 地址（点分十进制）
    public static String getDeviceIpAddress(Context context) {
        WifiManager wifiManager = (WifiManager)
            context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (wifiManager != null) {
            WifiInfo wifiInfo = wifiManager.getConnectionInfo();
            int ipAddress = wifiInfo.getIpAddress();

            // 转换为点分十进制表示
            return String.format(
                Locale.US,
                "%d.%d.%d.%d",
                (ipAddress & 0xff),
                (ipAddress >> 8 & 0xff),
                (ipAddress >> 16 & 0xff),
                (ipAddress >> 24 & 0xff)
            );

        }
        return null;
    }

    // 获取子网掩码
    public static String getSubnetMask() {
        try {
            Enumeration<NetworkInterface> networkInterfaceEnumeration = NetworkInterface.getNetworkInterfaces();
            while (networkInterfaceEnumeration.hasMoreElements()) {
                NetworkInterface networkInterface = networkInterfaceEnumeration.nextElement();
                if (!networkInterface.isUp()) {
                    continue;
                }
                for (InterfaceAddress interfaceAddress : networkInterface.getInterfaceAddresses()) {
                    if (interfaceAddress.getAddress() instanceof Inet4Address) {
                        if (!"127.0.0.1".equals(interfaceAddress.getAddress().getHostAddress())) {
                            return calcMaskByPrefixLength(interfaceAddress.getNetworkPrefixLength());
                        }
                    }
                }
            }
        } catch (SocketException e) {
            Log.e("NetWorkUtils", Objects.requireNonNull(e.getMessage()));
        }
        return null;
    }

    public static String calcMaskByPrefixLength(int length) {
        int mask = 0xffffffff << (32 - length);
        int partsNum = 4;
        int bitsOfPart = 8;
        int[] maskParts = new int[partsNum];
        int selector = 0x000000ff;

        for (int i = 0; i < maskParts.length; i++) {
            int pos = maskParts.length - 1 - i;
            maskParts[pos] = (mask >> (i * bitsOfPart)) & selector;
        }

        StringBuilder result = new StringBuilder();
        result.append(maskParts[0]);
        for (int i = 1; i < maskParts.length; i++) {
            result.append(".").append(maskParts[i]);
        }
        return result.toString();
    }

    // 根据 IP 和子网掩码计算局域网范围
    public static String[] calculateIpRange(String ipAddress, String subnetMask) {
        try {
            // 将 IP 和子网掩码转换为整数
            byte[] ipBytes = InetAddress.getByName(ipAddress).getAddress();
            byte[] maskBytes = InetAddress.getByName(subnetMask).getAddress();

            int ipInt = bytesToInt(ipBytes);
            int maskInt = bytesToInt(maskBytes);

            // 计算网络地址和广播地址
            int networkAddress = ipInt & maskInt;
            int broadcastAddress = networkAddress | ~maskInt;

            // 计算第一个和最后一个主机地址
            int firstHost = networkAddress + 1;
            int lastHost = broadcastAddress - 1;

            // 转换为点分十进制
            return new String[]{
                intToIp(firstHost),
                intToIp(lastHost)
            };
        } catch (UnknownHostException e) {
            Log.e("NetworkUtils", "计算IP范围失败: " + e.getMessage());
            return null;
        }
    }

    // 将字节数组转换为整数
    private static int bytesToInt(byte[] bytes) {
        return (bytes[0] & 0xff) << 24 |
            (bytes[1] & 0xff) << 16 |
            (bytes[2] & 0xff) << 8 |
            (bytes[3] & 0xff);
    }

    // 将整数转换为点分十进制表示的 IP 地址
    private static String intToIp(int ipInt) {
        return String.format(
            Locale.US,
            "%d.%d.%d.%d",
            (ipInt >> 24) & 0xff,
            (ipInt >> 16) & 0xff,
            (ipInt >> 8) & 0xff,
            ipInt & 0xff
        );
    }
}
