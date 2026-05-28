package com.example.musicbot.handler;

import com.example.musicbot.engine.MusicGenerationEngine;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AudioStreamHandler extends TextWebSocketHandler {
    private final MusicGenerationEngine engine;
    private final Map<WebSocketSession, SessionState> sessions = new ConcurrentHashMap<>();

    // 🔥 НАША ИМПРОВИЗИРОВАННАЯ БАЗА ДАННЫХ 🔥
    // Хранит настройки пользователей по их Telegram ID
    private static final Map<String, String> savedMoods = new ConcurrentHashMap<>();
    private static final Map<String, Integer> savedBpms = new ConcurrentHashMap<>();

    class SessionState {
        volatile String mood = "ambient";
        volatile int bpm = 80;
        volatile int step = 0;
        String userId = null; // Запоминаем, чей это сеанс
    }

    public AudioStreamHandler(MusicGenerationEngine engine) { this.engine = engine; }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        SessionState state = new SessionState();
        sessions.put(session, state);

        new Thread(() -> {
            while (session.isOpen()) {
                try {
                    String data = engine.generateTick(state.mood, state.step);
                    session.sendMessage(new TextMessage(data));
                    state.step = (state.step + 1) % 8;

                    int sleepTime = (60000 / state.bpm) / 2;
                    Thread.sleep(sleepTime);
                } catch (Exception e) { break; }
            }
        }).start();
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        SessionState state = sessions.get(session);
        if (state == null) return;

        String payload = message.getPayload();

        // 1. АВТОРИЗАЦИЯ И ВОССТАНОВЛЕНИЕ НАСТРОЕК
        if (payload.startsWith("USER:")) {
            String userId = payload.split(":")[1];
            state.userId = userId;

            // Если пользователь уже был тут, загружаем его настройки
            if (savedMoods.containsKey(userId)) {
                state.mood = savedMoods.get(userId);
                state.bpm = savedBpms.get(userId);

                // Отправляем команду фронтенду обновить ползунки
                try {
                    session.sendMessage(new TextMessage("SYNC:" + state.mood + ":" + state.bpm));
                } catch (Exception e) {}
            }
        }
        // 2. СОХРАНЕНИЕ НОВЫХ НАСТРОЕК (если они меняются)
        else if (payload.startsWith("MOOD:")) {
            state.mood = payload.split(":")[1];
            state.step = 0;
            if (state.userId != null) savedMoods.put(state.userId, state.mood);
        }
        else if (payload.startsWith("BPM:")) {
            state.bpm = Integer.parseInt(payload.split(":")[1]);
            if (state.userId != null) savedBpms.put(state.userId, state.bpm);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }
}