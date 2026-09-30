package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.RewindingYarnReceiveDto;
import com.textileERP.textileSys.model.RewindingIssue;
import com.textileERP.textileSys.model.RewindingYarnReceive;
import com.textileERP.textileSys.service.RewindingYarnReceiveService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rewinding-yarn-receive")
@CrossOrigin(origins = "*")
public class RewindingYarnReceiveController {
    private final RewindingYarnReceiveService service;

    public RewindingYarnReceiveController(RewindingYarnReceiveService service) {
        this.service = service;
    }

    @GetMapping("/issue/{getpassNo}")
    public ResponseEntity<RewindingIssue> getIssue(@PathVariable String getpassNo) {
        return ResponseEntity.ok(service.getIssue(getpassNo));
    }

    @GetMapping("/{getpassNo}")
    public ResponseEntity<RewindingYarnReceive> getByGetpass(@PathVariable String getpassNo) {
        return ResponseEntity.ok(service.getByGetpass(getpassNo));
    }

    @PostMapping("/complete")
    public ResponseEntity<RewindingYarnReceive> complete(@RequestBody RewindingYarnReceiveDto request) {
        return ResponseEntity.ok(service.complete(request));
    }
}
