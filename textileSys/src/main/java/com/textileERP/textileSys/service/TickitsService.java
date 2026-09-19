package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.TickitsDto;
import com.textileERP.textileSys.model.Parties;
import com.textileERP.textileSys.model.Tickits;
import com.textileERP.textileSys.repository.PartiesRepository;
import com.textileERP.textileSys.repository.TickitsRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TickitsService {

    private final TickitsRepository tickitsRepository;
    private final PartiesRepository partiesRepository;

    public TickitsService(TickitsRepository tickitsRepository, PartiesRepository partiesRepository) {
        this.tickitsRepository = tickitsRepository;
        this.partiesRepository = partiesRepository;
    }

    // Get all active tickits
    public List<Tickits> getAllTickits() {
        return tickitsRepository.findByActiveTrue();
    }

    // Get tickit by ID
    public Tickits getTickitById(Long id) {
        return tickitsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tickit not found with id: " + id));
    }

    // Get tickits by Party ID
    public List<Tickits> getTickitsByPartyId(Long partyId) {
        return tickitsRepository.findByPartyPartyIdAndActiveTrue(partyId);
    }

    // Create tickit
    public Tickits createTickit(TickitsDto request) {
        if (request.getPartyId() == null) {
            throw new RuntimeException("Party ID is required");
        }

        Parties party = partiesRepository.findById(request.getPartyId())
                .orElseThrow(() -> new RuntimeException("Party not found with id: " + request.getPartyId()));

        if (tickitsRepository.existsByTickitNameIgnoreCaseAndPartyPartyId(request.getTickitName(), request.getPartyId())) {
            throw new RuntimeException("Tickit already exists for this party");
        }

        Tickits tickit = new Tickits();
        tickit.setTickitName(request.getTickitName());
        tickit.setParty(party);
        tickit.setActive(true);

        return tickitsRepository.save(tickit);
    }

    // Update tickit
    public Tickits updateTickit(Long id, TickitsDto request) {
        Tickits tickit = getTickitById(id);

        Long targetPartyId = request.getPartyId() != null ? request.getPartyId() : tickit.getParty().getPartyId();
        Parties party = partiesRepository.findById(targetPartyId)
                .orElseThrow(() -> new RuntimeException("Party not found with id: " + targetPartyId));

        if (tickitsRepository.existsByTickitNameIgnoreCaseAndPartyPartyIdAndTickitIdNot(
                request.getTickitName(), targetPartyId, id)) {
            throw new RuntimeException("Tickit with this name already exists for this party");
        }

        tickit.setTickitName(request.getTickitName());
        tickit.setParty(party);

        return tickitsRepository.save(tickit);
    }

    // Soft delete tickit
    public void deleteTickit(Long id) {
        Tickits tickit = getTickitById(id);
        tickit.setActive(false);
        tickitsRepository.save(tickit);
    }
}
