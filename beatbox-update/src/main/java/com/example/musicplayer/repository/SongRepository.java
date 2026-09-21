package com.example.musicplayer.repository;

import com.example.musicplayer.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SongRepository extends JpaRepository<Song, Long> {
}
