package com.example.musicplayer.service;

import com.example.musicplayer.model.Playlist;
import com.example.musicplayer.model.Song;
import com.example.musicplayer.repository.PlaylistRepository;
import com.example.musicplayer.repository.SongRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class MusicService {
    private final SongRepository songRepository;
    private final PlaylistRepository playlistRepository;
    private final Path uploadDirectory = Paths.get("uploads", "audio").toAbsolutePath().normalize();

    public MusicService(SongRepository songRepository, PlaylistRepository playlistRepository) {
        this.songRepository = songRepository;
        this.playlistRepository = playlistRepository;
        try {
            Files.createDirectories(uploadDirectory);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create audio upload directory", e);
        }
    }

    public List<Song> getSongs() {
        return songRepository.findAll();
    }

    public List<Playlist> getPlaylists() {
        return playlistRepository.findAll();
    }

    public Song uploadSong(String title, String artist, String genre, String duration, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select an audio file");
        }

        String contentType = file.getContentType();
        String originalName = file.getOriginalFilename() == null ? "song" : file.getOriginalFilename();
        String extension = getExtension(originalName, contentType);

        if (!isSupportedAudio(extension, contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Supported audio formats: MP3, WAV, OGG, M4A and AAC");
        }

        String cleanTitle = title == null || title.isBlank()
                ? removeExtension(originalName)
                : title.trim();
        String cleanArtist = artist == null || artist.isBlank() ? "Unknown Artist" : artist.trim();
        String cleanGenre = genre == null || genre.isBlank() ? "Other" : genre.trim();
        String cleanDuration = duration == null || duration.isBlank() ? "0:00" : duration.trim();

        String storedFileName = UUID.randomUUID() + extension;
        Path target = uploadDirectory.resolve(storedFileName).normalize();

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save audio file", e);
        }

        Song song = new Song(cleanTitle, cleanArtist, cleanGenre, cleanDuration,
                "/api/songs/file/" + storedFileName);
        return songRepository.save(song);
    }

    public Path getAudioFile(String fileName) {
        Path file = uploadDirectory.resolve(fileName).normalize();
        if (!file.startsWith(uploadDirectory) || !Files.exists(file) || !Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Audio file not found");
        }
        return file;
    }

    private String getExtension(String filename, String contentType) {
        int dot = filename.lastIndexOf('.');
        if (dot >= 0) {
            String ext = filename.substring(dot).toLowerCase();
            if (ext.matches("\\.(mp3|wav|ogg|m4a|aac)")) return ext;
        }
        if (contentType == null) return "";
        return switch (contentType.toLowerCase()) {
            case "audio/mpeg" -> ".mp3";
            case "audio/wav", "audio/x-wav", "audio/wave" -> ".wav";
            case "audio/ogg" -> ".ogg";
            case "audio/mp4", "audio/x-m4a" -> ".m4a";
            case "audio/aac" -> ".aac";
            default -> "";
        };
    }

    private boolean isSupportedAudio(String extension, String contentType) {
        if (!extension.isBlank()) return true;
        return contentType != null && contentType.toLowerCase().startsWith("audio/");
    }

    private String removeExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }

    public Playlist createPlaylist(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Playlist name is required");
        }
        return playlistRepository.save(new Playlist(name.trim()));
    }

    public Playlist addSongToPlaylist(Long playlistId, Long songId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Playlist not found"));
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Song not found"));

        if (playlist.getSongs().stream().noneMatch(s -> s.getId().equals(songId))) {
            playlist.getSongs().add(song);
        }
        return playlistRepository.save(playlist);
    }
}
