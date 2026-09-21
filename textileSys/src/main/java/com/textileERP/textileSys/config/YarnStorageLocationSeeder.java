package com.textileERP.textileSys.config;

import com.textileERP.textileSys.model.YarnStorageLocation;
import com.textileERP.textileSys.repository.YarnStorageLocationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class YarnStorageLocationSeeder {

    @Bean
    CommandLineRunner seedYarnStorageLocations(YarnStorageLocationRepository repository) {
        return args -> {
            Map<Long, String> standardLocations = Map.of(
                    1L, "Factory Warehouse",
                    2L, "Gate Pass",
                    3L, "Weaver",
                    4L, "Sizing",
                    5L, "Other",
                    6L, "Dyeing"
            );

            standardLocations.forEach((id, name) -> {
                YarnStorageLocation location = repository.findById(id)
                        .orElseGet(() -> repository.findByLocationNameIgnoreCase(name).orElse(null));
                if (location == null) {
                    repository.save(new YarnStorageLocation(null, name, true));
                } else if (!name.equals(location.getLocationName()) || !Boolean.TRUE.equals(location.getActive())) {
                    location.setLocationName(name);
                    location.setActive(true);
                    repository.save(location);
                }
            });
        };
    }
}
