package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.SizingYarnInwardDto;
import com.textileERP.textileSys.model.*;
import com.textileERP.textileSys.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class SizingYarnInwardService {

    private final SizingYarnInwardRepository sizingYarnInwardRepository;
    private final SizingSetRepository sizingSetRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final SizingUnitRepository sizingUnitRepository;
    private final YarnCountRepository yarnCountRepository;
    private final TickitsRepository tickitsRepository;
    private final PartiesRepository partiesRepository;

    public SizingYarnInwardService(
            SizingYarnInwardRepository sizingYarnInwardRepository,
            SizingSetRepository sizingSetRepository,
            FabricOrderRepository fabricOrderRepository,
            SizingUnitRepository sizingUnitRepository,
            YarnCountRepository yarnCountRepository,
            TickitsRepository tickitsRepository,
            PartiesRepository partiesRepository) {
        this.sizingYarnInwardRepository = sizingYarnInwardRepository;
        this.sizingSetRepository = sizingSetRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.sizingUnitRepository = sizingUnitRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.tickitsRepository = tickitsRepository;
        this.partiesRepository = partiesRepository;
    }

    // Get all
    public List<SizingYarnInward> getAllSizingYarnInwards() {
        return sizingYarnInwardRepository.findAll();
    }

    // Get by ID
    public SizingYarnInward getSizingYarnInwardById(Long id) {
        return sizingYarnInwardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sizing yarn inward entry not found with id: " + id));
    }

    // Get by Sizing Set ID
    public List<SizingYarnInward> getBySizingSetId(Long sizingSetId) {
        return sizingYarnInwardRepository.findBySizingSetSizingSetId(sizingSetId);
    }

    // Get by Order ID
    public List<SizingYarnInward> getByOrderId(Long orderId) {
        return sizingYarnInwardRepository.findByOrderOrderId(orderId);
    }

    // Get by Sizing Unit ID
    public List<SizingYarnInward> getBySizingUnitId(Long sizingId) {
        return sizingYarnInwardRepository.findBySizingUnitSizingId(sizingId);
    }

    // Get by Party ID
    public List<SizingYarnInward> getByPartyId(Long partyId) {
        return sizingYarnInwardRepository.findByPartyPartyId(partyId);
    }

    // Create
    public SizingYarnInward createSizingYarnInward(SizingYarnInwardDto request) {
        SizingYarnInward entity = new SizingYarnInward();
        mapDtoToEntity(request, entity);
        return sizingYarnInwardRepository.save(entity);
    }

    // Update
    public SizingYarnInward updateSizingYarnInward(Long id, SizingYarnInwardDto request) {
        SizingYarnInward entity = getSizingYarnInwardById(id);
        mapDtoToEntity(request, entity);
        return sizingYarnInwardRepository.save(entity);
    }

    // Delete
    public void deleteSizingYarnInward(Long id) {
        SizingYarnInward entity = getSizingYarnInwardById(id);
        sizingYarnInwardRepository.delete(entity);
    }

    private void mapDtoToEntity(SizingYarnInwardDto dto, SizingYarnInward entity) {
        if (dto.getInwardDate() != null) {
            entity.setInwardDate(dto.getInwardDate());
        } else if (entity.getInwardDate() == null) {
            entity.setInwardDate(LocalDate.now());
        }

        // Sizing Set mapping
        if (dto.getSizingSetId() != null) {
            SizingSet sizingSet = sizingSetRepository.findById(dto.getSizingSetId())
                    .orElseThrow(() -> new RuntimeException("Sizing set not found with id: " + dto.getSizingSetId()));
            entity.setSizingSet(sizingSet);
        } else {
            entity.setSizingSet(null);
        }

        // Order mapping
        if (dto.getOrderId() != null) {
            FabricOrder order = fabricOrderRepository.findById(dto.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Fabric order not found with id: " + dto.getOrderId()));
            entity.setOrder(order);
        } else {
            entity.setOrder(null);
        }

        // Sizing Unit mapping
        if (dto.getSizingId() != null) {
            SizingUnit sizingUnit = sizingUnitRepository.findById(dto.getSizingId())
                    .orElseThrow(() -> new RuntimeException("Sizing unit not found with id: " + dto.getSizingId()));
            entity.setSizingUnit(sizingUnit);
        } else {
            entity.setSizingUnit(null);
        }

        // Yarn Count mapping
        if (dto.getCountId() != null) {
            YarnCount count = yarnCountRepository.findById(dto.getCountId())
                    .orElseThrow(() -> new RuntimeException("Yarn count not found with id: " + dto.getCountId()));
            entity.setCount(count);
        } else {
            entity.setCount(null);
        }

        // Tickit mapping
        if (dto.getTickitId() != null) {
            Tickits tickit = tickitsRepository.findById(dto.getTickitId())
                    .orElseThrow(() -> new RuntimeException("Tickit not found with id: " + dto.getTickitId()));
            entity.setTickit(tickit);
        } else {
            entity.setTickit(null);
        }

        // Party mapping
        if (dto.getPartyId() != null) {
            Parties party = partiesRepository.findById(dto.getPartyId())
                    .orElseThrow(() -> new RuntimeException("Party not found with id: " + dto.getPartyId()));
            entity.setParty(party);
        } else {
            entity.setParty(null);
        }

        entity.setBags(dto.getBags());
        entity.setWeightKg(dto.getWeightKg());
        entity.setRemark(dto.getRemark());
    }
}
