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
                    5L, "Other"
            );

            standardLocations.forEach((id, name) -> repository.findById(id).ifPresentOrElse(
                    location -> {
                        if (!name.equals(location.getLocationName()) || !Boolean.TRUE.equals(location.getActive())) {
                            location.setLocationName(name);
                            location.setActive(true);
                            repository.save(location);
                        }
                    },
                    () -> repository.save(new YarnStorageLocation(id, name, true))
            ));
        };
    }
}
