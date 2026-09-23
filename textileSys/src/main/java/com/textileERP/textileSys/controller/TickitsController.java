package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.TickitsDto;
import com.textileERP.textileSys.model.Tickits;
import com.textileERP.textileSys.service.TickitsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickits")
@CrossOrigin(origins = "*")
public class TickitsController {

    private final TickitsService tickitsService;

    public TickitsController(TickitsService tickitsService) {
        this.tickitsService = tickitsService;
    }

    // =========================================================
    // GET ALL ACTIVE TICKITS
    // =========================================================

    @GetMapping
    public ResponseEntity<List<Tickits>> getAllTickits() {

        return ResponseEntity.ok(
                tickitsService.getAllTickits()
        );
    }

    // =========================================================
    // GET TICKIT BY ID
    // =========================================================

    @GetMapping("/{id}")
    public ResponseEntity<Tickits> getTickitById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                tickitsService.getTickitById(id)
        );
    }

    // =========================================================
    // CREATE TICKIT
    // =========================================================

    @PostMapping
    public ResponseEntity<Tickits> createTickit(
            @RequestBody TickitsDto request
    ) {

        Tickits savedTickit =
                tickitsService.createTickit(request);

        return new ResponseEntity<>(
                savedTickit,
                HttpStatus.CREATED
        );
    }

    // =========================================================
    // UPDATE TICKIT
    // =========================================================

    @PutMapping("/{id}")
    public ResponseEntity<Tickits> updateTickit(
            @PathVariable Long id,
            @RequestBody TickitsDto request
    ) {

        Tickits updatedTickit =
                tickitsService.updateTickit(
                        id,
                        request
                );

        return ResponseEntity.ok(
                updatedTickit
        );
    }

    // =========================================================
    // SOFT DELETE TICKIT
    // =========================================================

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTickit(
            @PathVariable Long id
    ) {

        tickitsService.deleteTickit(id);

        return ResponseEntity.ok(
                "Tickit deleted successfully"
        );
    }
}