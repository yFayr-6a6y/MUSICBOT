package com.example.musicbot.engine;

import org.springframework.stereotype.Service;
import java.util.Random;

@Service
public class MusicGenerationEngine {
    private final Random random = new Random();

    // Мелодии для каждого стиля
    private final int[] lofiArp = {69, 72, 74, 76}; // Минорная пентатоника
    private final int[] cyberpunkArp = {50, 53, 57, 58}; // Мрачный басовый синт
    private final int[] chilloutArp = {77, 79, 81, 84}; // Мажорная (радостная)
    private final int[] ambientArp = {79, 83, 86, 88}; // Высокие "звездочки"

    public String generateTick(String mood, int step) {
        int bass = 0, mid = 0, high = 0;
        int kick = 0, hat = 0, arp = 0;

        switch (mood) {
            case "lo-fi":
                // МЕДЛЕННЫЙ ХИП-ХОП: Аккорды играют редко и тяжело
                if (step == 0) { bass = 45; mid = 60; high = 64; } // Am
                if (step == 4) { bass = 50; mid = 62; high = 65; } // Dm
                if (step == 0 || step == 5) kick = 1; // Удар на 1 и "и" 3-й доли
                if (step == 2 || step == 6) hat = 1;
                if (random.nextInt(10) > 7) arp = lofiArp[random.nextInt(lofiArp.length)];
                break;

            case "chillout":
                // ТРОПИЧЕСКИЙ ХАУС: Аккорды бьют быстро, "синкопой"
                if (step == 0 || step == 3 || step == 6) {
                    bass = 53; mid = 65; high = 69; // F Major (очень светлый)
                }
                if (step == 0 || step == 4) kick = 1; // Прямая танцевальная бочка
                if (step % 2 != 0) hat = 1; // Частые хэты
                if (step == 7) arp = chilloutArp[random.nextInt(chilloutArp.length)];
                break;

            case "ambient":
                // КИНЕМАТОГРАФИЯ: Густые, переливающиеся мажорные аккорды
                if (step == 0) { bass = 48; mid = 64; high = 71; } // Cmaj7
                if (step == 4) { bass = 45; mid = 64; high = 72; } // Am9
                if (step % 2 == 0) arp = ambientArp[random.nextInt(ambientArp.length)];
                break;

            case "sleep":
                // ГЛУБОКИЙ СОН: Никаких аккордов! Только гулкий бас.
                if (step == 0 && random.nextInt(10) > 4) {
                    bass = 36; // Саб-бас (очень низко)
                }
                // Очень редкий "колокольчик"
                if (step == 4 && random.nextInt(10) > 8) {
                    arp = 84;
                }
                break;

            case "cyberpunk":
                if (step % 2 == 0) { bass = 38; mid = 50; high = 57; }
                if (step % 4 == 0) kick = 1;
                if (step % 2 != 0) hat = 1;
                if (step % 2 == 0) arp = cyberpunkArp[random.nextInt(cyberpunkArp.length)];
                break;

            case "space":
                if (step == 0) { bass = 42; mid = 66; high = 70; }
                if (step == 0) kick = 1;
                break;
        }

        return bass + "," + mid + "," + high + "," + kick + "," + hat + "," + arp;
    }
}