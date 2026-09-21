package com.example.musicplayer.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Playlist {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToMany
    private List<Song> songs = new ArrayList<>();

    public Playlist() {}

    public Playlist(String name) { this.name = name; }

    public Long getId() { return id; }
    public String getName() { return name; }
    public List<Song> getSongs() { return songs; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setSongs(List<Song> songs) { this.songs = songs; }
}
