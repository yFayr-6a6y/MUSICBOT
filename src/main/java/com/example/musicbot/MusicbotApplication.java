package com.example.musicbot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication(scanBasePackages = "com.example.musicbot")
@ComponentScan(basePackages = "com.example.musicbot") // Явно указываем корень для поиска
public class MusicbotApplication {
	public static void main(String[] args) {
		SpringApplication.run(MusicbotApplication.class, args);
	}
}