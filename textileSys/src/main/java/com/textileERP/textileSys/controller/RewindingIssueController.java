package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.RewindingIssueDto;
import com.textileERP.textileSys.model.RewindingIssue;
import com.textileERP.textileSys.service.RewindingIssueService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rewinding-issues")
@CrossOrigin(origins = "*")
public class RewindingIssueController {

    private final RewindingIssueService service;

    public RewindingIssueController(RewindingIssueService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<RewindingIssue>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RewindingIssue> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping("/getpass/{getpassNo}")
    public ResponseEntity<RewindingIssue> getByGetpassNo(@PathVariable String getpassNo) {
        return ResponseEntity.ok(service.getByGetpassNo(getpassNo));
    }

    @PostMapping
    public ResponseEntity<RewindingIssue> create(@RequestBody RewindingIssueDto request) {
        return new ResponseEntity<>(service.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RewindingIssue> update(@PathVariable Long id, @RequestBody RewindingIssueDto request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Rewinding issue deleted successfully");
    }
}
