package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.BeamInwardBatchDto;
import com.textileERP.textileSys.dto.BeamInwardDto;
import com.textileERP.textileSys.model.BeamInward;
import com.textileERP.textileSys.service.BeamInwardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @GetMapping("/next-inward-no")
    public ResponseEntity<Map<String, String>> getNextInwardNo() {
        return ResponseEntity.ok(Map.of("inwardNo", beamInwardService.generateNextInwardNo()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BeamInward> getById(@PathVariable Long id) {
        return ResponseEntity.ok(beamInwardService.getById(id));
    }

    @GetMapping("/inward-no/{inwardNo}")
    public ResponseEntity<List<BeamInward>> getByInwardNo(@PathVariable String inwardNo) {
        return ResponseEntity.ok(beamInwardService.getByInwardNo(inwardNo));
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

    @PostMapping("/batch")
    public ResponseEntity<List<BeamInward>> createBatch(@RequestBody BeamInwardBatchDto request) {
        List<BeamInward> saved = beamInwardService.createBatch(request);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PostMapping({"/complete", "/completes"})
    public ResponseEntity<List<BeamInward>> completeInward(@RequestBody com.textileERP.textileSys.dto.BeamInwardCompleteDto request) {
        List<BeamInward> saved = beamInwardService.completeInward(request);
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

