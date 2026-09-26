package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.YarnReceiveDyeingDto;
import com.textileERP.textileSys.model.YarnReceiveDyeing;
import com.textileERP.textileSys.service.YarnReceiveDyeingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/yarn-receive-dyeing")
@CrossOrigin(origins = "*")
public class YarnReceiveDyeingController {

    private final YarnReceiveDyeingService service;

    public YarnReceiveDyeingController(YarnReceiveDyeingService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<YarnReceiveDyeing>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping
    public ResponseEntity<YarnReceiveDyeing> create(@RequestBody YarnReceiveDyeingDto request) {
        return new ResponseEntity<>(service.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<YarnReceiveDyeing> update(@PathVariable Long id, @RequestBody YarnReceiveDyeingDto request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Yarn receive from dyeing entry deleted successfully");
    }
}
