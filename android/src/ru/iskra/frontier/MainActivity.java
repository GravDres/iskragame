package ru.iskra.frontier;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import org.json.JSONObject;

public final class MainActivity extends Activity {
    private WebView web;
    private LanRoom room;
    private boolean destroyed;
    private static final int OPEN_MOD = 41;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        immersive();
        web = new WebView(this);
        web.setBackgroundColor(0xff15232a);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true); settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false); settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMediaPlaybackRequiresUserGesture(false); settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false); settings.setDisplayZoomControls(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return true; }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) { return true; }
        });
        room = new LanRoom(event -> runOnUiThread(() -> evaluate("window.nativeEvent", event.toString())));
        web.addJavascriptInterface(new Bridge(), "Android");
        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    private void evaluate(String function, String value) {
        if (destroyed || web == null) return;
        web.evaluateJavascript(function + " && " + function + "(" + JSONObject.quote(value) + ");", null);
    }
    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        if (android.os.Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams attributes = getWindow().getAttributes();
            attributes.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(attributes);
        }
    }
    @Override public void onWindowFocusChanged(boolean focus) { super.onWindowFocusChanged(focus); if (focus) immersive(); }
    @Override protected void onPause() {
        if (web != null) { web.evaluateJavascript("window.nativePause && window.nativePause();", null); web.onPause(); }
        super.onPause();
    }
    @Override protected void onResume() { super.onResume(); if (web != null) web.onResume(); immersive(); }
    @Override public void onBackPressed() { if (web != null) web.evaluateJavascript("window.nativeBack && window.nativeBack();", null); else super.onBackPressed(); }
    @Override protected void onDestroy() { destroyed = true; if (room != null) room.stop(); if (web != null) { web.removeJavascriptInterface("Android"); web.destroy(); } super.onDestroy(); }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request != OPEN_MOD || result != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        new Thread(() -> {
            try (InputStream input = getContentResolver().openInputStream(uri); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
                if (input == null) throw new java.io.IOException("No input");
                byte[] buffer = new byte[4096]; int n;
                while ((n = input.read(buffer)) != -1) { bytes.write(buffer, 0, n); if (bytes.size() > 150000) throw new java.io.IOException("Too large"); }
                String text = bytes.toString("UTF-8");
                runOnUiThread(() -> evaluate("window.nativeMod", text));
            } catch (Exception e) {
                runOnUiThread(() -> { try { JSONObject error = new JSONObject(); error.put("type", "error"); error.put("message", "Мод не прочитан. Нужен JSON-файл до 150 КБ."); evaluate("window.nativeEvent", error.toString()); } catch (Exception ignored) { } });
            }
        }, "mod-import").start();
    }

    public final class Bridge {
        @JavascriptInterface public void host(String state) { room.host(state); }
        @JavascriptInterface public void join(String address) { room.join(address); }
        @JavascriptInterface public void send(String json) { room.send(json); }
        @JavascriptInterface public void updateHost(String state) { room.updateSnapshot(state); }
        @JavascriptInterface public void disconnect() { room.stop(); }
        @JavascriptInterface public void importMod() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE); intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] {"application/json", "text/plain", "application/octet-stream"});
                startActivityForResult(intent, OPEN_MOD);
            });
        }
        @JavascriptInterface public void exit() { runOnUiThread(() -> finish()); }
    }
}
