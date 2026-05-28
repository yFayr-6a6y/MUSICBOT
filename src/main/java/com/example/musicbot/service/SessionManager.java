package com.example.musicbot.service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionManager {
    // Храним настройки для каждого sessionId
    private final Map<String, Map<String, Object>> sessions = new ConcurrentHashMap<>();

    // Базовые настройки по умолчанию для новых слушателей
    private Map<String, Object> getDefaultSettings() {
        return Map.of(
                "mode", "Space",
                "instrument", "Pad",
                "bpm", 60
        );
    }

    public void updateSession(String sessionId, Map<String, Object> newSettings) {
        sessions.putIfAbsent(sessionId, new ConcurrentHashMap<>(getDefaultSettings()));
        sessions.get(sessionId).putAll(newSettings);
    }

    public Map<String, Object> getSessionSettings(String sessionId) {
        return sessions.getOrDefault(sessionId, getDefaultSettings());
    }

    public void removeSession(String sessionId) {
        sessions.remove(sessionId);
    }
}