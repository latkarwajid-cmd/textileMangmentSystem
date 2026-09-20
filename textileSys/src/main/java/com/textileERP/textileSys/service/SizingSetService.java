package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.SizingSetDto;
import com.textileERP.textileSys.model.FabricOrder;
import com.textileERP.textileSys.model.Parties;
import com.textileERP.textileSys.model.SizingSet;
import com.textileERP.textileSys.model.SizingUnit;
import com.textileERP.textileSys.model.Tickits;
import com.textileERP.textileSys.model.YarnCount;
import com.textileERP.textileSys.repository.FabricOrderRepository;
import com.textileERP.textileSys.repository.PartiesRepository;
import com.textileERP.textileSys.repository.SizingSetRepository;
import com.textileERP.textileSys.repository.SizingUnitRepository;
import com.textileERP.textileSys.repository.TickitsRepository;
import com.textileERP.textileSys.repository.YarnCountRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SizingSetService {

    private final SizingSetRepository sizingSetRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final PartiesRepository partiesRepository;
    private final SizingUnitRepository sizingUnitRepository;
    private final TickitsRepository tickitsRepository;
    private final YarnCountRepository yarnCountRepository;

    public SizingSetService(
            SizingSetRepository sizingSetRepository,
            FabricOrderRepository fabricOrderRepository,
            PartiesRepository partiesRepository,
            SizingUnitRepository sizingUnitRepository,
            TickitsRepository tickitsRepository,
            YarnCountRepository yarnCountRepository) {
        this.sizingSetRepository = sizingSetRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.partiesRepository = partiesRepository;
        this.sizingUnitRepository = sizingUnitRepository;
        this.tickitsRepository = tickitsRepository;
        this.yarnCountRepository = yarnCountRepository;
    }

    public List<SizingSet> getAllSizingSets() {
        return sizingSetRepository.findAll();
    }

    public SizingSet createSizingSet(SizingSetDto request) {
        if (request.getSetNo() == null || request.getSetNo().isBlank()) {
            throw new RuntimeException("Sizing set number is required");
        }
        if (sizingSetRepository.existsBySetNoIgnoreCase(request.getSetNo().trim())) {
            throw new RuntimeException("Sizing set already exists with number: " + request.getSetNo());
        }

        SizingSet sizingSet = new SizingSet();
        sizingSet.setSetNo(request.getSetNo().trim());
        sizingSet.setOrder(findOrder(request.getOrderId()));
        sizingSet.setCount(findCount(request.getCountId()));
        sizingSet.setTickit(findTickit(request.getTickitId()));
        sizingSet.setSizingUnit(findSizingUnit(request.getSizingId()));
        sizingSet.setParty(findParty(request.getPartyId()));
        sizingSet.setQuality(request.getQuality());
        sizingSet.setTotalEnds(request.getTotalEnds());
        sizingSet.setSizingMeters(request.getSizingMeters());
        sizingSet.setSizingCount(request.getSizingCount());
        sizingSet.setStatus(request.getStatus() == null || request.getStatus().isBlank()
                ? "OPEN" : request.getStatus());
        return sizingSetRepository.save(sizingSet);
    }

    public SizingSet updateSizingSet(Long id, SizingSetDto request) {
        SizingSet existing = sizingSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sizing set not found: " + id));

        if (request.getSetNo() != null && !request.getSetNo().isBlank()) {
            if (!existing.getSetNo().equalsIgnoreCase(request.getSetNo()) && sizingSetRepository.existsBySetNoIgnoreCase(request.getSetNo().trim())) {
                throw new RuntimeException("Sizing set already exists with number: " + request.getSetNo());
            }
            existing.setSetNo(request.getSetNo().trim());
        }

        existing.setOrder(findOrder(request.getOrderId()));
        existing.setCount(findCount(request.getCountId()));
        existing.setTickit(findTickit(request.getTickitId()));
        existing.setSizingUnit(findSizingUnit(request.getSizingId()));
        existing.setParty(findParty(request.getPartyId()));
        existing.setQuality(request.getQuality());
        existing.setTotalEnds(request.getTotalEnds());
        existing.setSizingMeters(request.getSizingMeters());
        existing.setSizingCount(request.getSizingCount());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            existing.setStatus(request.getStatus());
        }

        return sizingSetRepository.save(existing);
    }

    public void softDeleteSizingSet(Long id) {
        SizingSet existing = sizingSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sizing set not found: " + id));
        existing.setStatus("DELETED");
        sizingSetRepository.save(existing);
    }

    private FabricOrder findOrder(Long id) {
        return id == null ? null : fabricOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fabric order not found with id: " + id));
    }

    private YarnCount findCount(Long id) {
        return id == null ? null : yarnCountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn count not found with id: " + id));
    }

    private Tickits findTickit(Long id) {
        return id == null ? null : tickitsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tickit not found with id: " + id));
    }

    private SizingUnit findSizingUnit(Long id) {
        return id == null ? null : sizingUnitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sizing unit not found with id: " + id));
    }

    private Parties findParty(Long id) {
        return id == null ? null : partiesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Party not found with id: " + id));
    }
}