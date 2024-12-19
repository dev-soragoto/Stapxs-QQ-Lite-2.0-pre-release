package cn.stapxs.qqweb.connector;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Onebot")
public class OnebotPlugin extends Plugin {

    private WebSocketClient webSocketClient;
    private final Onebot implementation = new Onebot();

    public void sendNotify(String type, String data) {
        JSObject ret = new JSObject();
        ret.put("type", type);
        ret.put("data", data);
        this.notifyListeners("onebot:event", ret);
    }

    @Override
    public void load() {
        super.load();
        Log.i("Plugin", " _____ _____ _____ _____ __ __  \n" +
                        "|   __|_   _|  _  |  _  |  |  | \n" +
                        "|__   | | | |     |   __|-   -| \n" +
                        "|_____| |_| |__|__|__|  |__|__| CopyRight © Stapx Steve\n" +
                        "=======================================================\n" +
                        "Capacitor Onebot 基础连接器加载完成");
        Log.i("Plugin", "当前执行平台：Android");
        Log.i("Plugin", "** 此插件 Java 版本代码 70% 由 Github Copilot 及 OpenAI ChatGPT 4o 生成 **");
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String value = call.getString("url");

        JSObject ret = new JSObject();
        webSocketClient = implementation.connect(this, webSocketClient, value);
        ret.put("value", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void send(PluginCall call) {
        String value = call.getString("data");

        JSObject ret = new JSObject();
        ret.put("value", implementation.send(webSocketClient, value));
        call.resolve(ret);
    }

    @PluginMethod
    public void close(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", implementation.close(webSocketClient));
        call.resolve(ret);
    }

    @PluginMethod
    public void findService(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", implementation.findService(this));
        call.resolve(ret);
    }
}
