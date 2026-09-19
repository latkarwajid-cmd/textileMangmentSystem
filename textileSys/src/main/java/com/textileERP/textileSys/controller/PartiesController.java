package com.textileERP.textileSys.controller;


import com.textileERP.textileSys.dto.PartiesDto;
import com.textileERP.textileSys.model.Parties;
import com.textileERP.textileSys.service.PartiesServies;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parties")
@CrossOrigin(origins = "*")
public class PartiesController {


    private final PartiesServies partiesServies;

    public PartiesController( PartiesServies partiesServies) {
        this.partiesServies = partiesServies;

    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<Parties>> getAllParties() {

        return ResponseEntity.ok(
                partiesServies.getAllParties()
        );
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Parties> getPartyById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                partiesServies.getPartyById(id)
        );
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Parties> createParty(
            @RequestBody PartiesDto request) {

        Parties savedParty = partiesServies.createParty(request);

        return new ResponseEntity<>(
                savedParty,
                HttpStatus.CREATED
        );
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<Parties> updateParty(
            @PathVariable Long id,
            @RequestBody PartiesDto request) {

        Parties updatedParty =
                partiesServies.updateParty(id, request);

        return ResponseEntity.ok(updatedParty);
    }

    // DELETE / SOFT DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteParty(
            @PathVariable Long id) {

        partiesServies.deleteParty(id);

        return ResponseEntity.ok(
                "Parties deleted successfully"
        );
    }
}
