package cn.stapxs.qqweb.connector;

import android.content.Context;
import android.util.Log;

import com.getcapacitor.JSObject;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ScanNetwork {
    private static final int THREAD_COUNT = 50;
    private static final int TIMEOUT = 500;
    private static final int[] PORTS = {3001, 5700};

    private final Context context;
    private final OnebotPlugin plugin;

    public ScanNetwork(Context context, OnebotPlugin plugin) {
        this.context = context;
        this.plugin = plugin;
    }

    public void scanNetwork() {
        Log.i("ScanNetwork", "正在扫描网路……");
        // 获取当前设备 IP 和子网掩码
        String deviceIp = NetworkUtils.getDeviceIpAddress(context);
        String subnetMask = NetworkUtils.getSubnetMask();

        if (deviceIp == null || subnetMask == null) {
            Log.e("ScanNetwork","无法获取 IP 地址或子网掩码！");
            return;
        }

        Log.d("ScanNetwork", "当前 IP：" + deviceIp + "， 子网掩码：" + subnetMask);

        // 计算 IP 范围
        String[] ipRange = NetworkUtils.calculateIpRange(deviceIp, subnetMask);
        if (ipRange == null) {
            Log.e("ScanNetwork","无法计算 IP 范围！");
            return;
        }

        String startIp = ipRange[0];
        String endIp = ipRange[1];

        // 转换开始和结束 IP 为整数
        int startIpInt = ipToInt(startIp);
        int endIpInt = ipToInt(endIp);

        Log.i("ScanNetwork","扫描范围：" + startIp + " - " + endIp + "，共 " + (endIpInt - startIpInt) + " 个。");

        // 如果范围大于 1000 则放弃
        if (endIpInt - startIpInt > 1000) {
            Log.e("ScanNetwork", "IP 范围太大！放弃扫描。");
            return;
        }

        // 执行端口扫描
        executeScan(startIpInt, endIpInt);
    }

    private void executeScan(int startIpInt, int endIpInt) {
        ExecutorService executor = Executors.newFixedThreadPool(THREAD_COUNT);

        // 遍历 IP 地址范围
        for (int ip = startIpInt; ip <= endIpInt; ip++) {
            String targetIp = intToIp(ip);
            for (int port : PORTS) {
                executor.submit(() -> {
                    if (isPortOpen(targetIp, port)) {
                        Log.d("ScanNetwork","开放端口：" + targetIp + ":" + port);
                        JSObject json = new JSObject();
                        json.put("address", targetIp);
                        json.put("port", port);
                        plugin.sendNotify("onServiceFound", json.toString());
                    }
                });
            }
        }

        executor.shutdown();
    }

    private boolean isPortOpen(String host, int port) {
        try {
            URL url = new URL("http://" + host + ":" + port);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(TIMEOUT);
            connection.setRequestMethod("GET");
            int responseCode = connection.getResponseCode();
            Log.d("ScanNetwork", "http://" + host + ":" + port + " --> " + responseCode);
            return responseCode > 0;
        } catch (IOException e) {
            return false;
        }
    }

    private int ipToInt(String ipAddress) {
        String[] parts = ipAddress.split("\\.");
        return (Integer.parseInt(parts[0]) << 24) |
            (Integer.parseInt(parts[1]) << 16) |
            (Integer.parseInt(parts[2]) << 8) |
            Integer.parseInt(parts[3]);
    }

    private String intToIp(int ipInt) {
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
