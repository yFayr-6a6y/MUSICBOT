package com.example.musicbot.model;

public class SessionUpdateRequest {
    private String sessionId;
    private Integer bpm;
    private String mood;
    private String instrument;

    // Геттеры и сеттеры
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public Integer getBpm() { return bpm; }
    public void setBpm(Integer bpm) { this.bpm = bpm; }
    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }
    public String getInstrument() { return instrument; }
    public void setInstrument(String instrument) { this.instrument = instrument; }
}