package com.example.musicplayer.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Song {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String artist;
    private String genre;
    private String duration;
    private String audioUrl;

    public Song() {}

    public Song(String title, String artist, String genre, String duration, String audioUrl) {
        this.title = title;
        this.artist = artist;
        this.genre = genre;
        this.duration = duration;
        this.audioUrl = audioUrl;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getArtist() { return artist; }
    public String getGenre() { return genre; }
    public String getDuration() { return duration; }
    public String getAudioUrl() { return audioUrl; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setArtist(String artist) { this.artist = artist; }
    public void setGenre(String genre) { this.genre = genre; }
    public void setDuration(String duration) { this.duration = duration; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
}
