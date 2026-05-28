package com.example.musicbot.model;

public class UserSession {
    private String sessionId;
    private int bpm;
    private String mood;
    private String instrument;

    public UserSession(String sessionId) {
        this.sessionId = sessionId;
        this.bpm = 90;         // Значения по умолчанию
        this.mood = "Calm";
        this.instrument = "Piano";
    }

    public String getSessionId() { return sessionId; }
    public int getBpm() { return bpm; }
    public void setBpm(int bpm) { this.bpm = bpm; }
    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }
    public String getInstrument() { return instrument; }
    public void setInstrument(String instrument) { this.instrument = instrument; }
}