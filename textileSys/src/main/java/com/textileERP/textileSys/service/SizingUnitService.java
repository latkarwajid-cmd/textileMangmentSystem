package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.SizingUnitDto;
import com.textileERP.textileSys.model.Parties;
import com.textileERP.textileSys.model.SizingUnit;
import com.textileERP.textileSys.repository.PartiesRepository;
import com.textileERP.textileSys.repository.SizingUnitRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SizingUnitService {

    private final SizingUnitRepository sizingUnitRepository;
    private final PartiesRepository partiesRepository;

    public SizingUnitService(SizingUnitRepository sizingUnitRepository, PartiesRepository partiesRepository) {
        this.sizingUnitRepository = sizingUnitRepository;
        this.partiesRepository = partiesRepository;
    }

    // Get all active sizing units
    public List<SizingUnit> getAllSizingUnits() {
        return sizingUnitRepository.findByActiveTrue();
    }

    // Get sizing unit by ID
    public SizingUnit getSizingUnitById(Long id) {
        return sizingUnitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sizing unit not found with id: " + id));
    }

    // Get sizing units by Party ID
    public List<SizingUnit> getSizingUnitsByPartyId(Long partyId) {
        return sizingUnitRepository.findByPartyPartyIdAndActiveTrue(partyId);
    }

    // Create sizing unit
    public SizingUnit createSizingUnit(SizingUnitDto request) {
        Parties party = null;
        if (request.getPartyId() != null) {
            party = partiesRepository.findById(request.getPartyId())
                    .orElseThrow(() -> new RuntimeException("Party not found with id: " + request.getPartyId()));

            if (sizingUnitRepository.existsBySizingNameIgnoreCaseAndPartyPartyId(request.getSizingName(), request.getPartyId())) {
                throw new RuntimeException("Sizing unit already exists for this party");
            }
        } else {
            if (sizingUnitRepository.existsBySizingNameIgnoreCaseAndPartyIsNull(request.getSizingName())) {
                throw new RuntimeException("Sizing unit already exists with name: " + request.getSizingName());
            }
        }

        SizingUnit sizingUnit = new SizingUnit();
        sizingUnit.setSizingName(request.getSizingName());
        sizingUnit.setParty(party);
        sizingUnit.setActive(true);

        return sizingUnitRepository.save(sizingUnit);
    }

    // Update sizing unit
    public SizingUnit updateSizingUnit(Long id, SizingUnitDto request) {
        SizingUnit sizingUnit = getSizingUnitById(id);

        Parties party = null;
        if (request.getPartyId() != null) {
            party = partiesRepository.findById(request.getPartyId())
                    .orElseThrow(() -> new RuntimeException("Party not found with id: " + request.getPartyId()));

            if (sizingUnitRepository.existsBySizingNameIgnoreCaseAndPartyPartyIdAndSizingIdNot(
                    request.getSizingName(), request.getPartyId(), id)) {
                throw new RuntimeException("Sizing unit already exists for this party");
            }
        } else {
            if (sizingUnitRepository.existsBySizingNameIgnoreCaseAndPartyIsNullAndSizingIdNot(
                    request.getSizingName(), id)) {
                throw new RuntimeException("Sizing unit already exists with name: " + request.getSizingName());
            }
        }

        sizingUnit.setSizingName(request.getSizingName());
        sizingUnit.setParty(party);

        return sizingUnitRepository.save(sizingUnit);
    }

    // Soft delete sizing unit
    public void deleteSizingUnit(Long id) {
        SizingUnit sizingUnit = getSizingUnitById(id);
        sizingUnit.setActive(false);
        sizingUnitRepository.save(sizingUnit);
    }
}
