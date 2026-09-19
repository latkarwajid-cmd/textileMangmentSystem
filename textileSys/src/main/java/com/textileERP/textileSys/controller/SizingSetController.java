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

import java.util.List;

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

    @PostMapping
    public ResponseEntity<SizingSet> createSizingSet(@RequestBody SizingSetDto request) {
        return new ResponseEntity<>(sizingSetService.createSizingSet(request), HttpStatus.CREATED);
    }
}