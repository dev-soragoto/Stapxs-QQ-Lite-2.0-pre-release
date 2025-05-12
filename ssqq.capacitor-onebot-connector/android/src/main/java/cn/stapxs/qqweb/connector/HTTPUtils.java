package cn.stapxs.qqweb.connector;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class HTTPUtils {

    private static final OkHttpClient client = new OkHttpClient();

    public static String resolveFinalUrl(String urlString) throws IOException {
        int maxRedirects = 100;
        int redirectCount = 0;
        URL url = new URL(urlString);
        HttpURLConnection connection;

        while (true) {
            connection = (HttpURLConnection) url.openConnection();
            // 不自动处理重定向
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(10000);
            connection.setRequestMethod("GET");

            int responseCode = connection.getResponseCode();

            // 判断是否是重定向
            if (responseCode >= 300 && responseCode < 400) {
                String location = connection.getHeaderField("Location");
                if (location == null) {
                    throw new IOException("Redirect with no Location header");
                }

                // 构造新的 URL（支持相对路径）
                url = new URL(url, location);

                redirectCount++;
                if (redirectCount > maxRedirects) {
                    throw new IOException("Too many redirects");
                }
            } else {
                // 非重定向状态，返回最终 URL
                return url.toString();
            }
        }
    }

    public static String fetchContent(String url, String mimeType) throws IOException {
        Request request = new Request.Builder()
            .url(url)
            .addHeader("Accept", mimeType)
            .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code " + response);
            }

            return response.body() != null ? response.body().string() : null;
        }
    }
}
