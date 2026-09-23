package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.TickitsDto;
import com.textileERP.textileSys.model.Tickits;
import com.textileERP.textileSys.repository.TickitsRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TickitsService {

    private final TickitsRepository tickitsRepository;

    public TickitsService(TickitsRepository tickitsRepository) {
        this.tickitsRepository = tickitsRepository;
    }

    // =========================================================
    // GET ALL ACTIVE TICKITS
    // =========================================================

    public List<Tickits> getAllTickits() {
        return tickitsRepository.findByActiveTrue();
    }

    // =========================================================
    // GET TICKIT BY ID
    // =========================================================

    public Tickits getTickitById(Long id) {

        return tickitsRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Tickit not found with id: " + id
                        )
                );
    }

    // =========================================================
    // CREATE TICKIT
    // =========================================================

    public Tickits createTickit(TickitsDto request) {

        if (request.getTickitName() == null ||
                request.getTickitName().trim().isEmpty()) {

            throw new RuntimeException(
                    "Tickit name is required"
            );
        }

        String tickitName =
                request.getTickitName().trim();

        // Tickit name must be unique
        if (tickitsRepository
                .existsByTickitNameIgnoreCase(tickitName)) {

            throw new RuntimeException(
                    "Tickit with this name already exists"
            );
        }

        Tickits tickit = new Tickits();

        tickit.setTickitName(tickitName);

        tickit.setActive(true);

        return tickitsRepository.save(tickit);
    }

    // =========================================================
    // UPDATE TICKIT
    // =========================================================

    public Tickits updateTickit(
            Long id,
            TickitsDto request
    ) {

        Tickits tickit =
                getTickitById(id);

        if (request.getTickitName() == null ||
                request.getTickitName().trim().isEmpty()) {

            throw new RuntimeException(
                    "Tickit name is required"
            );
        }

        String tickitName =
                request.getTickitName().trim();

        // Check duplicate name,
        // but ignore the current tickit
        if (tickitsRepository
                .existsByTickitNameIgnoreCaseAndTickitIdNot(
                        tickitName,
                        id
                )) {

            throw new RuntimeException(
                    "Tickit with this name already exists"
            );
        }

        tickit.setTickitName(
                tickitName
        );

        return tickitsRepository.save(tickit);
    }

    // =========================================================
    // SOFT DELETE
    // =========================================================

    public void deleteTickit(Long id) {

        Tickits tickit =
                getTickitById(id);

        tickit.setActive(false);

        tickitsRepository.save(tickit);
    }
}