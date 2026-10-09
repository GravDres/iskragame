package ru.iskra.frontier;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;

/** A real localhost round trip: host, guest welcome, guest pose, host state. */
public final class LanRoomTest {
    public static void main(String[] args) throws Exception {
        CountDownLatch hosted = new CountDownLatch(1), welcome = new CountDownLatch(1), pose = new CountDownLatch(1), state = new CountDownLatch(1);
        AtomicReference<String> failure = new AtomicReference<>();
        AtomicReference<String> guestId = new AtomicReference<>();
        LanRoom host = new LanRoom(event -> {
            String type = event.optString("type");
            if ("hosted".equals(type)) hosted.countDown();
            if ("player".equals(type)) {
                String id = event.optJSONObject("player").optString("id");
                if ("forged-id".equals(id)) failure.set("Guest identity was not assigned by server");
                guestId.set(id); pose.countDown();
            }
            if ("error".equals(type)) failure.set(event.optString("message"));
        });
        LanRoom guest = new LanRoom(event -> {
            String type = event.optString("type");
            if ("welcome".equals(type)) {
                if (event.optJSONObject("state").optInt("version") != 1) failure.set("Welcome snapshot missing");
                welcome.countDown();
            }
            if ("state".equals(type)) state.countDown();
            if ("error".equals(type)) failure.set(event.optString("message"));
        });
        try {
            host.host("{\"version\":1,\"mode\":\"creative\"}");
            require(hosted.await(8, TimeUnit.SECONDS), "Host did not start");
            guest.join("127.0.0.1");
            require(welcome.await(8, TimeUnit.SECONDS), "Guest did not receive snapshot");
            guest.send("{\"type\":\"player\",\"player\":{\"id\":\"forged-id\",\"x\":384,\"y\":18,\"z\":384,\"yaw\":0}}");
            require(pose.await(5, TimeUnit.SECONDS), "Host did not receive guest pose");
            require(guestId.get() != null && !guestId.get().isEmpty(), "Missing server-assigned identity");
            host.send("{\"type\":\"state\",\"time\":210,\"enemies\":[]}");
            require(state.await(5, TimeUnit.SECONDS), "Guest did not receive host state");
            require(failure.get() == null, failure.get());
            System.out.println("PASS LAN host, welcome, guest pose, server identity and host state");
        } finally { guest.stop(); host.stop(); }
    }
    private static void require(boolean ok, String message) { if (!ok) throw new AssertionError(message); }
}
