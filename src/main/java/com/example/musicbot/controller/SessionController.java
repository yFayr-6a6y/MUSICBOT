package com.example.musicbot.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
@CrossOrigin(origins = "http://localhost:5173") // Разрешаем запросы только с этого адреса
public class SessionController {

    @GetMapping("/test")
    public String testConnection() {
        return "Сервер работает, связь установлена!";
    }
}