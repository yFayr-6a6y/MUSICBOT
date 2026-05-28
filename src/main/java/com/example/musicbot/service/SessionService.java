package com.example.musicbot.service;

import com.example.musicbot.model.UserSession;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {
    // Потокобезопасное хранилище сессий
    private final Map<String, UserSession> sessions = new ConcurrentHashMap<>();

    public UserSession createSession() {
        // Генерируем уникальный ID для сессии при открытии Mini App
        String sessionId = UUID.randomUUID().toString();
        UserSession session = new UserSession(sessionId);
        sessions.put(sessionId, session);
        return session;
    }

    public UserSession getSession(String sessionId) {
        return sessions.get(sessionId);
    }

    public UserSession updateSession(String sessionId, Integer bpm, String mood, String instrument) {
        UserSession session = sessions.get(sessionId);
        if (session != null) {
            if (bpm != null) session.setBpm(bpm);
            if (mood != null) session.setMood(mood);
            if (instrument != null) session.setInstrument(instrument);
        }
        return session;
    }

    public void removeSession(String sessionId) {
        sessions.remove(sessionId);
    }
}