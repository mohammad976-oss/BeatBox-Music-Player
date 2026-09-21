package com.example.musicplayer.controller;

import com.example.musicplayer.model.Playlist;
import com.example.musicplayer.model.Song;
import com.example.musicplayer.service.MusicService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MusicController {
    private final MusicService musicService;

    public MusicController(MusicService musicService) {
        this.musicService = musicService;
    }

    @GetMapping("/songs")
    public List<Song> songs() {
        return musicService.getSongs();
    }

    @PostMapping(value = "/songs/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Song uploadSong(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String duration,
            @RequestParam("file") MultipartFile file) {
        return musicService.uploadSong(title, artist, genre, duration, file);
    }

    @GetMapping("/songs/file/{fileName:.+}")
    public ResponseEntity<Resource> audio(@PathVariable String fileName) {
        Path file = musicService.getAudioFile(fileName);
        String contentType;
        try {
            contentType = Files.probeContentType(file);
        } catch (Exception e) {
            contentType = null;
        }
        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (contentType != null) {
            try { mediaType = MediaType.parseMediaType(contentType); }
            catch (Exception ignored) { }
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .body(new FileSystemResource(file));
    }

    @GetMapping("/playlists")
    public List<Playlist> playlists() {
        return musicService.getPlaylists();
    }

    @PostMapping("/playlists")
    public Playlist createPlaylist(@RequestBody Map<String, String> body) {
        return musicService.createPlaylist(body.get("name"));
    }

    @PostMapping("/playlists/{playlistId}/songs/{songId}")
    public Playlist addSong(@PathVariable Long playlistId, @PathVariable Long songId) {
        return musicService.addSongToPlaylist(playlistId, songId);
    }
}
