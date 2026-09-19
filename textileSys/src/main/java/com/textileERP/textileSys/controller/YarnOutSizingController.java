package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.YarnOutSizingDto;
import com.textileERP.textileSys.model.YarnOutSizing;
import com.textileERP.textileSys.service.YarnOutSizingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/yarn-out-sizing", "/api/yarnoutsizing", "/api/yarn-out-for-sizing"})
@CrossOrigin(origins = "*")
public class YarnOutSizingController {

    private final YarnOutSizingService yarnOutSizingService;

    public YarnOutSizingController(YarnOutSizingService yarnOutSizingService) {
        this.yarnOutSizingService = yarnOutSizingService;
    }

    @GetMapping
    public ResponseEntity<List<YarnOutSizing>> getAllYarnOutSizing() {
        return ResponseEntity.ok(yarnOutSizingService.getAllYarnOutSizing());
    }

    @GetMapping("/{id}")
    public ResponseEntity<YarnOutSizing> getYarnOutSizingById(@PathVariable Long id) {
        return ResponseEntity.ok(yarnOutSizingService.getYarnOutSizingById(id));
    }

    @GetMapping("/sizing-set/{sizingSetId}")
    public ResponseEntity<List<YarnOutSizing>> getYarnOutSizingBySizingSetId(@PathVariable Long sizingSetId) {
        return ResponseEntity.ok(yarnOutSizingService.getYarnOutSizingBySizingSetId(sizingSetId));
    }

    @PostMapping
    public ResponseEntity<YarnOutSizing> createYarnOutSizing(@RequestBody YarnOutSizingDto request) {
        YarnOutSizing saved = yarnOutSizingService.createYarnOutSizing(request);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<YarnOutSizing> updateYarnOutSizing(
            @PathVariable Long id,
            @RequestBody YarnOutSizingDto request) {
        YarnOutSizing updated = yarnOutSizingService.updateYarnOutSizing(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteYarnOutSizing(@PathVariable Long id) {
        yarnOutSizingService.deleteYarnOutSizing(id);
        return ResponseEntity.ok("Yarn out sizing entry deleted successfully");
    }
}
