package com.example.musicplayer.config;

import com.example.musicplayer.model.Song;
import com.example.musicplayer.repository.SongRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {
    @Bean
    CommandLineRunner loadSongs(SongRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new Song("Ocean Dreams", "Demo Artist", "Chill", "0:08", "/audio/ocean-dreams.wav"));
                repository.save(new Song("Morning Light", "Demo Artist", "Lo-Fi", "0:10", "/audio/morning-light.wav"));
                repository.save(new Song("City Nights", "Demo Artist", "Electronic", "0:12", "/audio/city-nights.wav"));
            }
        };
    }
}
