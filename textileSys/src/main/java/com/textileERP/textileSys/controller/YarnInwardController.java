package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.YarnInwardDto;
import com.textileERP.textileSys.model.YarnInward;
import com.textileERP.textileSys.service.YarnInwardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/yarn-inward", "/api/yarninward", "/api/yarn-inwards"})
@CrossOrigin(origins = "*")
public class YarnInwardController {

    private final YarnInwardService yarnInwardService;

    public YarnInwardController(YarnInwardService yarnInwardService) {
        this.yarnInwardService = yarnInwardService;
    }

    @GetMapping
    public ResponseEntity<List<YarnInward>> getAllYarnInwards() {
        return ResponseEntity.ok(yarnInwardService.getAllYarnInwards());
    }

    @GetMapping("/{id}")
    public ResponseEntity<YarnInward> getYarnInwardById(@PathVariable Long id) {
        return ResponseEntity.ok(yarnInwardService.getYarnInwardById(id));
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<List<YarnInward>> getYarnInwardsBySupplierId(@PathVariable Long supplierId) {
        return ResponseEntity.ok(yarnInwardService.getYarnInwardsBySupplierId(supplierId));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<YarnInward>> getYarnInwardsByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(yarnInwardService.getYarnInwardsByOrderId(orderId));
    }

    @GetMapping("/payment-status/{status}")
    public ResponseEntity<List<YarnInward>> getYarnInwardsByPaymentStatus(@PathVariable String status) {
        return ResponseEntity.ok(yarnInwardService.getYarnInwardsByPaymentStatus(status));
    }


    @PostMapping
    public ResponseEntity<YarnInward> createYarnInward(@RequestBody YarnInwardDto request) {
        YarnInward savedYarnInward = yarnInwardService.createYarnInward(request);
        return new ResponseEntity<>(savedYarnInward, HttpStatus.CREATED);
    }
    @PutMapping("/{id}")
    public ResponseEntity<YarnInward> updateYarnInward(
            @PathVariable Long id,
            @RequestBody YarnInwardDto request) {
        YarnInward updatedYarnInward = yarnInwardService.updateYarnInward(id, request);
        return ResponseEntity.ok(updatedYarnInward);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteYarnInward(@PathVariable Long id) {
        yarnInwardService.deleteYarnInward(id);
        return ResponseEntity.ok("Yarn inward entry deleted successfully");
    }
}
