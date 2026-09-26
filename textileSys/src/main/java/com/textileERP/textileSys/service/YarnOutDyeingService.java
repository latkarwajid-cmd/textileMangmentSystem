package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnOutDyeingDto;
import com.textileERP.textileSys.model.*;
import com.textileERP.textileSys.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class YarnOutDyeingService {

    private final YarnOutDyeingRepository repository;
    private final SizingSetRepository sizingSetRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final YarnCountRepository yarnCountRepository;
    private final TickitsRepository tickitsRepository;
    private final SizingUnitRepository sizingUnitRepository;
    private final PartiesRepository partiesRepository;

    public YarnOutDyeingService(
            YarnOutDyeingRepository repository,
            SizingSetRepository sizingSetRepository,
            FabricOrderRepository fabricOrderRepository,
            YarnCountRepository yarnCountRepository,
            TickitsRepository tickitsRepository,
            SizingUnitRepository sizingUnitRepository,
            PartiesRepository partiesRepository) {
        this.repository = repository;
        this.sizingSetRepository = sizingSetRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.tickitsRepository = tickitsRepository;
        this.sizingUnitRepository = sizingUnitRepository;
        this.partiesRepository = partiesRepository;
    }

    public List<YarnOutDyeing> getAll() {
        return repository.findAll();
    }

    public YarnOutDyeing getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn out dyeing entry not found with id: " + id));
    }

    public List<YarnOutDyeing> getBySizingSet(Long sizingSetId) {
        return repository.findBySizingSetSizingSetId(sizingSetId);
    }

    public List<YarnOutDyeing> getByOrder(Long orderId) {
        return repository.findByOrderOrderId(orderId);
    }

    public YarnOutDyeing create(YarnOutDyeingDto request) {
        YarnOutDyeing entity = new YarnOutDyeing();
        map(request, entity);
        return repository.save(entity);
    }

    public YarnOutDyeing update(Long id, YarnOutDyeingDto request) {
        YarnOutDyeing entity = getById(id);
        map(request, entity);
        return repository.save(entity);
    }

    public void delete(Long id) {
        repository.delete(getById(id));
    }

    private void map(YarnOutDyeingDto dto, YarnOutDyeing entity) {
        entity.setGatePassNo(dto.getGatePassNo());
        entity.setSizingSet(dto.getSizingSetId() == null ? null : findSizingSet(dto.getSizingSetId()));
        entity.setOrder(findOrder(dto.getOrderId()));
        entity.setOutDate(dto.getOutDate() == null && entity.getOutDate() == null
                ? LocalDate.now() : dto.getOutDate());
        entity.setFirmName(dto.getFirmName());
        entity.setCount(findCount(dto.getCountId()));
        entity.setTickit(findTickit(dto.getTickitId()));
        entity.setSizingUnit(null);
        entity.setParty(findParty(dto.getDyeingUnitId()));
        entity.setBags(dto.getBags());
        entity.setCone(dto.getCone());
        entity.setWeightKg(dto.getWeightKg());
        entity.setRemark(dto.getRemark());
    }

    private SizingSet findSizingSet(Long id) {
        return sizingSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sizing set not found with id: " + id));
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