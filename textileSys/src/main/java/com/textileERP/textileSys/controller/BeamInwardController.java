package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.BeamInwardDto;
import com.textileERP.textileSys.model.BeamInward;
import com.textileERP.textileSys.service.BeamInwardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/beam-inward", "/api/beaminward"})
@CrossOrigin(origins = "*")
public class BeamInwardController {

    private final BeamInwardService beamInwardService;

    public BeamInwardController(BeamInwardService beamInwardService) {
        this.beamInwardService = beamInwardService;
    }

    @GetMapping
    public ResponseEntity<List<BeamInward>> getAll() {
        return ResponseEntity.ok(beamInwardService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BeamInward> getById(@PathVariable Long id) {
        return ResponseEntity.ok(beamInwardService.getById(id));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<BeamInward>> getByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(beamInwardService.getByOrder(orderId));
    }

    @GetMapping("/sizing-set/{sizingSetId}")
    public ResponseEntity<List<BeamInward>> getBySizingSet(@PathVariable Long sizingSetId) {
        return ResponseEntity.ok(beamInwardService.getBySizingSet(sizingSetId));
    }

    @PostMapping
    public ResponseEntity<BeamInward> create(@RequestBody BeamInwardDto request) {
        BeamInward saved = beamInwardService.create(request);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BeamInward> update(@PathVariable Long id, @RequestBody BeamInwardDto request) {
        BeamInward updated = beamInwardService.update(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        beamInwardService.delete(id);
        return ResponseEntity.ok("Beam inward deleted successfully");
    }
}
