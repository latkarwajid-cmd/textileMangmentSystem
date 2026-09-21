package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.SizingSetDto;
import com.textileERP.textileSys.model.SizingSet;
import com.textileERP.textileSys.service.SizingSetService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sizing-sets")
@CrossOrigin(origins = "*")
public class SizingSetController {

    private final SizingSetService sizingSetService;

    public SizingSetController(SizingSetService sizingSetService) {
        this.sizingSetService = sizingSetService;
    }

    @GetMapping
    public ResponseEntity<List<SizingSet>> getAllSizingSets() {
        return ResponseEntity.ok(sizingSetService.getAllSizingSets());
    }

    @GetMapping("/next-set-no")
    public ResponseEntity<Map<String, String>> getNextSetNo() {
        return ResponseEntity.ok(Map.of("setNo", sizingSetService.generateNextSetNo()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SizingSet> getSizingSetById(@PathVariable Long id) {
        return ResponseEntity.ok(sizingSetService.getSizingSetById(id));
    }

    @PostMapping
    public ResponseEntity<SizingSet> createSizingSet(@RequestBody SizingSetDto request) {
        return new ResponseEntity<>(sizingSetService.createSizingSet(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SizingSet> updateSizingSet(@PathVariable Long id, @RequestBody SizingSetDto request) {
        return ResponseEntity.ok(sizingSetService.updateSizingSet(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSizingSet(@PathVariable Long id) {
        sizingSetService.softDeleteSizingSet(id);
        return ResponseEntity.ok("Sizing set deleted");
    }
}