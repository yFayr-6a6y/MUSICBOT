package com.example.musicbot.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.beans.factory.annotation.Autowired;

// ВАЖНО: Убедитесь, что здесь импортируется ВАШ класс-обработчик
// Если он лежит в другой папке, IntelliJ IDEA сама предложит его импортировать (Alt+Enter)
import com.example.musicbot.handler.AudioStreamHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final AudioStreamHandler handler;

    public WebSocketConfig(AudioStreamHandler handler) {
        this.handler = handler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/music")
                .setAllowedOrigins("*"); // Разрешаем соединения с любых источников
    }
}