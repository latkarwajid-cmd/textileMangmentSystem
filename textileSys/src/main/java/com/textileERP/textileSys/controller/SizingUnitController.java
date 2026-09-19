package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.SizingUnitDto;
import com.textileERP.textileSys.model.SizingUnit;
import com.textileERP.textileSys.service.SizingUnitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/sizing-units", "/api/sizing"})
@CrossOrigin(origins = "*")
public class SizingUnitController {

    private final SizingUnitService sizingUnitService;

    public SizingUnitController(SizingUnitService sizingUnitService) {
        this.sizingUnitService = sizingUnitService;
    }

    @GetMapping
    public ResponseEntity<List<SizingUnit>> getAllSizingUnits() {
        return ResponseEntity.ok(sizingUnitService.getAllSizingUnits());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SizingUnit> getSizingUnitById(@PathVariable Long id) {
        return ResponseEntity.ok(sizingUnitService.getSizingUnitById(id));
    }

    @GetMapping("/party/{partyId}")
    public ResponseEntity<List<SizingUnit>> getSizingUnitsByPartyId(@PathVariable Long partyId) {
        return ResponseEntity.ok(sizingUnitService.getSizingUnitsByPartyId(partyId));
    }

    @PostMapping
    public ResponseEntity<SizingUnit> createSizingUnit(@RequestBody SizingUnitDto request) {
        SizingUnit savedSizingUnit = sizingUnitService.createSizingUnit(request);
        return new ResponseEntity<>(savedSizingUnit, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SizingUnit> updateSizingUnit(
            @PathVariable Long id,
            @RequestBody SizingUnitDto request) {
        SizingUnit updatedSizingUnit = sizingUnitService.updateSizingUnit(id, request);
        return ResponseEntity.ok(updatedSizingUnit);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSizingUnit(@PathVariable Long id) {
        sizingUnitService.deleteSizingUnit(id);
        return ResponseEntity.ok("Sizing unit deleted successfully");
    }
}
