package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.SizingYarnInwardDto;
import com.textileERP.textileSys.model.SizingYarnInward;
import com.textileERP.textileSys.service.SizingYarnInwardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/sizing-yarn-inward", "/api/sizingyarninward", "/api/sizing-yarn-inwards"})
@CrossOrigin(origins = "*")
public class SizingYarnInwardController {

    private final SizingYarnInwardService sizingYarnInwardService;

    public SizingYarnInwardController(SizingYarnInwardService sizingYarnInwardService) {
        this.sizingYarnInwardService = sizingYarnInwardService;
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<SizingYarnInward>> getAllSizingYarnInwards() {
        return ResponseEntity.ok(sizingYarnInwardService.getAllSizingYarnInwards());
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<SizingYarnInward> getSizingYarnInwardById(@PathVariable Long id) {
        return ResponseEntity.ok(sizingYarnInwardService.getSizingYarnInwardById(id));
    }

    // GET BY SIZING SET ID
    @GetMapping("/sizing-set/{sizingSetId}")
    public ResponseEntity<List<SizingYarnInward>> getBySizingSetId(@PathVariable Long sizingSetId) {
        return ResponseEntity.ok(sizingYarnInwardService.getBySizingSetId(sizingSetId));
    }

    // GET BY ORDER ID
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<SizingYarnInward>> getByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(sizingYarnInwardService.getByOrderId(orderId));
    }

    // GET BY SIZING UNIT ID
    @GetMapping("/sizing-unit/{sizingId}")
    public ResponseEntity<List<SizingYarnInward>> getBySizingUnitId(@PathVariable Long sizingId) {
        return ResponseEntity.ok(sizingYarnInwardService.getBySizingUnitId(sizingId));
    }

    // GET BY PARTY ID
    @GetMapping("/party/{partyId}")
    public ResponseEntity<List<SizingYarnInward>> getByPartyId(@PathVariable Long partyId) {
        return ResponseEntity.ok(sizingYarnInwardService.getByPartyId(partyId));
    }

    // CREATE
    @PostMapping
    public ResponseEntity<SizingYarnInward> createSizingYarnInward(@RequestBody SizingYarnInwardDto request) {
        SizingYarnInward saved = sizingYarnInwardService.createSizingYarnInward(request);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<SizingYarnInward> updateSizingYarnInward(
            @PathVariable Long id,
            @RequestBody SizingYarnInwardDto request) {
        SizingYarnInward updated = sizingYarnInwardService.updateSizingYarnInward(id, request);
        return ResponseEntity.ok(updated);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSizingYarnInward(@PathVariable Long id) {
        sizingYarnInwardService.deleteSizingYarnInward(id);
        return ResponseEntity.ok("Sizing yarn inward entry deleted successfully");
    }
}
