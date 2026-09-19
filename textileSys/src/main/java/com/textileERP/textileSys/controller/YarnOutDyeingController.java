package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.YarnOutDyeingDto;
import com.textileERP.textileSys.model.YarnOutDyeing;
import com.textileERP.textileSys.service.YarnOutDyeingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/yarn-out-dyeing", "/api/yarnoutdyeing"})
@CrossOrigin(origins = "*")
public class YarnOutDyeingController {

    private final YarnOutDyeingService service;

    public YarnOutDyeingController(YarnOutDyeingService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<YarnOutDyeing>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<YarnOutDyeing> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/sizing-set/{sizingSetId}")
    public ResponseEntity<List<YarnOutDyeing>> getBySizingSet(@PathVariable Long sizingSetId) {
        return ResponseEntity.ok(service.getBySizingSet(sizingSetId));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<YarnOutDyeing>> getByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(service.getByOrder(orderId));
    }

    @PostMapping
    public ResponseEntity<YarnOutDyeing> create(@RequestBody YarnOutDyeingDto request) {
        return new ResponseEntity<>(service.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<YarnOutDyeing> update(@PathVariable Long id, @RequestBody YarnOutDyeingDto request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Yarn out dyeing entry deleted successfully");
    }
}