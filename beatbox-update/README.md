# BeatBox Music Player

A full-stack music player built with Java 21, Spring Boot, Spring Data JPA, H2, HTML5, CSS3 and JavaScript.

## Features
- Play / pause / previous / next
- Shuffle and repeat
- Progress and volume controls
- Search by song, artist or genre
- Upload MP3, WAV, OGG, M4A and AAC files
- Create playlists
- Open a playlist and play its songs
- Add existing library songs to a playlist
- Upload a new song directly into a selected playlist
- Four switchable themes: Midnight, Ocean, Sunset and Emerald
- Theme selection is remembered with browser localStorage
- H2 file database for songs and playlists

## Run

```bash
mvn spring-boot:run
```

Open http://localhost:8065

## Playlist workflow

1. Open **Playlists**.
2. Click **New playlist** and create one.
3. Click **View / Add** on the playlist.
4. Use **Add songs** to choose songs already in the library, or **Upload song here** to upload a new audio file directly to that playlist.

Uploaded audio is stored in `uploads/audio/` and song metadata is saved in H2.
