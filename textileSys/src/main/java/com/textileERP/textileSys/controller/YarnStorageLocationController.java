package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.model.YarnStorageLocation;
import com.textileERP.textileSys.repository.YarnStorageLocationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/yarn-storage-locations")
@CrossOrigin(origins = "*")
public class YarnStorageLocationController {

    private final YarnStorageLocationRepository repository;

    public YarnStorageLocationController(YarnStorageLocationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<YarnStorageLocation>> getActiveLocations() {
        return ResponseEntity.ok(repository.findByActiveTrue());
    }
}
