package com.textileERP.textileSys.config;

import com.textileERP.textileSys.model.YarnStorageLocation;
import com.textileERP.textileSys.repository.YarnStorageLocationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class YarnStorageLocationSeeder {

    @Bean
    CommandLineRunner seedYarnStorageLocations(YarnStorageLocationRepository repository) {
        return args -> {
            List<String> standardLocations = List.of(
                    "Factory Warehouse",
                    "Gate Pass",
                    "Weaver",
                    "Sizing",
                    "Other"
            );

            standardLocations.forEach(name -> repository.findAll().stream()
                    .filter(location -> name.equals(location.getLocationName()))
                    .findFirst()
                    .ifPresentOrElse(
                            location -> {
                                if (!Boolean.TRUE.equals(location.getActive())) {
                                    location.setActive(true);
                                    repository.save(location);
                                }
                            },
                            () -> repository.save(new YarnStorageLocation(null, name, true))
                    ));
        };
    }
}
