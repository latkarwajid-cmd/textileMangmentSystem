package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.PartiesDto;
import com.textileERP.textileSys.model.Parties;
import com.textileERP.textileSys.repository.PartiesRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PartiesServies {

    private final PartiesRepository partyRepository;

    public PartiesServies(PartiesRepository partyRepository) {
        this.partyRepository = partyRepository;
    }

    // Get all active parties
    public List<Parties> getAllParties() {
        return partyRepository.findByStatusTrue();
    }

    // Get party by ID
    public Parties getPartyById(Long id) {

        return partyRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Party not found with id: " + id));
    }

    // Create party
    public Parties createParty(PartiesDto request) {

        if (partyRepository.existsByPartyNameIgnoreCase(request.getPartyName())) {
            throw new RuntimeException("Party already exists");
        }

        Parties party = new Parties();

        party.setPartyName(request.getPartyName());
        party.setPartyType(request.getPartyType());
        party.setPhone(request.getPhone());
        party.setAddress(request.getAddress());
        party.setGstNo(request.getGstNo());
        party.setStatus(true);

        return partyRepository.save(party);
    }

    // Update party
    public Parties updateParty(Long id, PartiesDto request) {

        Parties party = getPartyById(id);

        party.setPartyName(request.getPartyName());
        party.setPartyType(request.getPartyType());
        party.setPhone(request.getPhone());
        party.setAddress(request.getAddress());
        party.setGstNo(request.getGstNo());

        return partyRepository.save(party);
    }

    // Soft delete
    public void deleteParty(Long id) {

        Parties party = getPartyById(id);

        party.setStatus(false);

        partyRepository.save(party);
    }

}
