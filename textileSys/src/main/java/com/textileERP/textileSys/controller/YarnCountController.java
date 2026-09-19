package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.YarnCountDto;
import com.textileERP.textileSys.model.YarnCount;
import com.textileERP.textileSys.service.YarnCountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/yarn-counts", "/api/yarncount"})
@CrossOrigin(origins = "*")
public class YarnCountController {

    private final YarnCountService yarnCountService;

    public YarnCountController(YarnCountService yarnCountService) {
        this.yarnCountService = yarnCountService;
    }


    @GetMapping
    public ResponseEntity<List<YarnCount>> getAllYarnCounts() {
        return ResponseEntity.ok(yarnCountService.getAllYarnCounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<YarnCount> getYarnCountById(@PathVariable Long id) {
        return ResponseEntity.ok(yarnCountService.getYarnCountById(id));
    }

    @PostMapping
    public ResponseEntity<YarnCount> createYarnCount(@RequestBody YarnCountDto request) {
        YarnCount savedYarnCount = yarnCountService.createYarnCount(request);
        return new ResponseEntity<>(savedYarnCount, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<YarnCount> updateYarnCount(
            @PathVariable Long id,
            @RequestBody YarnCountDto request) {
        YarnCount updatedYarnCount = yarnCountService.updateYarnCount(id, request);
        return ResponseEntity.ok(updatedYarnCount);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteYarnCount(@PathVariable Long id) {
        yarnCountService.deleteYarnCount(id);
        return ResponseEntity.ok("Yarn count deleted successfully");
    }
}
