package cn.stapxs.qqweb.connector;

import android.content.Context;

public class Onebot {
    public WebSocketClient connect(OnebotPlugin plugin, WebSocketClient webSocketClient, String value) {
        WebSocketClient client = null;
        if(webSocketClient == null) {
            client = new WebSocketClient(plugin);
            client.connect(value);
        }
        return client;
    }

    public Boolean send(WebSocketClient webSocketClient, String value) {
        if(webSocketClient != null) {
            webSocketClient.sendMessage(value);
        }
        return true;
    }

    public Boolean close(WebSocketClient webSocketClient) {
        if(webSocketClient != null) {
            webSocketClient.close();
        }
        return true;
    }

    public Boolean findService(OnebotPlugin plugin) {
        ScanNetwork scanNetwork = new ScanNetwork(plugin.getBridge().getContext(), plugin);
        scanNetwork.scanNetwork();
        return true;
    }
}
