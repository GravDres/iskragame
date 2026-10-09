package ru.iskra.frontier;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Collections;
import java.util.Enumeration;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

/** Offline local-network transport. The hosting phone owns the simulation. */
public final class LanRoom {
    public interface Listener { void event(JSONObject event); }
    public static final int PORT = 24871;
    private final Listener listener;
    private final ConcurrentHashMap<String, Peer> peers = new ConcurrentHashMap<>();
    private ExecutorService executor;
    private volatile ServerSocket server;
    private volatile Peer upstream;
    private volatile boolean running;
    private volatile boolean hosting;
    private volatile JSONObject snapshot;
    private volatile int generation;

    public LanRoom(Listener listener) { this.listener = listener; }

    public synchronized void host(String state) {
        stop();
        try { snapshot = new JSONObject(state); } catch (Exception e) { error("Не удалось открыть мир."); return; }
        hosting = true; running = true;
        final int session = generation;
        executor = Executors.newCachedThreadPool();
        executor.execute(() -> {
            try {
                ServerSocket local = new ServerSocket(PORT);
                if (session != generation) { local.close(); return; }
                server = local;
                emit("hosted", "address", localAddress());
                while (running && session == generation) {
                    Socket socket = local.accept();
                    if (peers.size() >= 3) { socket.close(); continue; }
                    socket.setTcpNoDelay(true);
                    socket.setKeepAlive(true);
                    String id = UUID.randomUUID().toString().substring(0, 8);
                    Peer peer = new Peer(id, socket);
                    peers.put(id, peer);
                    JSONObject welcome = new JSONObject();
                    welcome.put("type", "welcome"); welcome.put("id", id); welcome.put("state", snapshot);
                    peer.write(welcome.toString());
                    emit("joined", "id", id);
                    executor.execute(() -> readHost(peer, session));
                }
            } catch (Exception e) { if (running && session == generation) error("Комната не открыта. Проверь Wi-Fi или занятый порт."); }
        });
    }

    public synchronized void join(String address) {
        stop();
        if (!address.matches("\\d{1,3}(\\.\\d{1,3}){3}")) { error("Нужен IPv4-адрес хозяина."); return; }
        running = true; hosting = false;
        final int session = generation;
        executor = Executors.newCachedThreadPool();
        executor.execute(() -> {
            Peer peer = null;
            try {
                Socket socket = new Socket();
                socket.connect(new java.net.InetSocketAddress(address, PORT), 6000);
                socket.setTcpNoDelay(true); socket.setKeepAlive(true);
                if (session != generation) { socket.close(); return; }
                peer = new Peer("host", socket); upstream = peer;
                String line;
                while (running && session == generation && (line = boundedLine(peer.reader)) != null) {
                    try { listener.event(new JSONObject(line)); } catch (Exception ignored) { }
                }
                if (running && session == generation) error("Хозяин закрыл комнату.");
            } catch (Exception e) {
                if (running && session == generation) error("Не удалось подключиться. Проверь адрес и общую сеть Wi-Fi.");
            } finally { if (peer != null) peer.close(); }
        });
    }

    private void readHost(Peer peer, int session) {
        try {
            String line;
            while (running && generation == session && (line = boundedLine(peer.reader)) != null) {
                JSONObject message;
                try { message = new JSONObject(line); } catch (Exception ignored) { continue; }
                String type = message.optString("type");
                // Guests may only submit their own pose and actions.
                if ("player".equals(type)) {
                    JSONObject player = message.optJSONObject("player");
                    if (player == null) continue;
                    player.put("id", peer.id); message.put("sender", peer.id);
                    listener.event(message); broadcast(message.toString(), peer.id);
                } else if ("action".equals(type)) {
                    message.put("sender", peer.id); listener.event(message);
                }
            }
        } catch (Exception ignored) { }
        finally {
            peer.close();
            if (generation == session) {
                peers.remove(peer.id);
                try { JSONObject left = new JSONObject(); left.put("type", "left"); left.put("id", peer.id); listener.event(left); broadcast(left.toString(), null); } catch (Exception ignored) { }
            }
        }
    }

    public void send(String json) {
        if (!running || json.length() > 1000000 || executor == null) return;
        final int session = generation;
        try { executor.execute(() -> {
            if (!running || generation != session) return;
            if (hosting) broadcast(json, null); else if (upstream != null) upstream.write(json);
        }); } catch (Exception ignored) { }
    }

    public void updateSnapshot(String state) {
        if (!hosting || state.length() > 1000000) return;
        try { snapshot = new JSONObject(state); } catch (Exception ignored) { }
    }

    private void broadcast(String json, String except) {
        for (Peer peer : peers.values()) if (!peer.id.equals(except)) peer.write(json);
    }

    public synchronized void stop() {
        running = false; generation++;
        try { if (server != null) server.close(); } catch (Exception ignored) { }
        server = null;
        if (upstream != null) upstream.close(); upstream = null;
        for (Peer peer : peers.values()) peer.close(); peers.clear();
        if (executor != null) executor.shutdownNow(); executor = null;
    }

    private static String boundedLine(BufferedReader reader) throws Exception {
        StringBuilder result = new StringBuilder();
        int c;
        while ((c = reader.read()) != -1) {
            if (c == '\n') return result.toString();
            if (c != '\r') result.append((char)c);
            if (result.length() > 1000000) throw new java.io.IOException("Packet too large");
        }
        return result.length() == 0 ? null : result.toString();
    }

    public static String localAddress() {
        try {
            String candidate = null;
            for (NetworkInterface net : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (net.isLoopback() || !net.isUp()) continue;
                for (InetAddress address : Collections.list(net.getInetAddresses())) {
                    if (!(address instanceof Inet4Address) || address.isLoopbackAddress()) continue;
                    String host = address.getHostAddress();
                    if (net.getName().startsWith("wlan") || net.getName().startsWith("ap")) return host;
                    if (address.isSiteLocalAddress()) candidate = host;
                }
            }
            return candidate == null ? "Проверь адрес в настройках Wi-Fi" : candidate;
        } catch (Exception e) { return "Проверь адрес в настройках Wi-Fi"; }
    }

    private void emit(String type, String key, String value) {
        try { JSONObject object = new JSONObject(); object.put("type", type); object.put(key, value); listener.event(object); } catch (Exception ignored) { }
    }
    private void error(String message) { emit("error", "message", message); }

    private static final class Peer {
        final String id; final Socket socket; final BufferedReader reader; final PrintWriter writer;
        Peer(String id, Socket socket) throws Exception {
            this.id = id; this.socket = socket;
            reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), "UTF-8"));
            writer = new PrintWriter(new java.io.OutputStreamWriter(socket.getOutputStream(), "UTF-8"), true);
        }
        synchronized void write(String line) { writer.println(line); }
        void close() { try { socket.close(); } catch (Exception ignored) { } }
    }
}
