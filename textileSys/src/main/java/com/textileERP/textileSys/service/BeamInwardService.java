package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.BeamInwardDto;
import com.textileERP.textileSys.model.BeamInward;
import com.textileERP.textileSys.model.FabricOrder;
import com.textileERP.textileSys.model.SizingSet;
import com.textileERP.textileSys.model.SizingUnit;
import com.textileERP.textileSys.repository.BeamInwardRepository;
import com.textileERP.textileSys.repository.FabricOrderRepository;
import com.textileERP.textileSys.repository.SizingSetRepository;
import com.textileERP.textileSys.repository.SizingUnitRepository;
import com.textileERP.textileSys.repository.YarnCountRepository;
import com.textileERP.textileSys.repository.TickitsRepository;
import com.textileERP.textileSys.repository.PartiesRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class BeamInwardService {

    private final BeamInwardRepository beamInwardRepository;
    private final SizingSetRepository sizingSetRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final SizingUnitRepository sizingUnitRepository;
    private final YarnCountRepository yarnCountRepository;
    private final TickitsRepository tickitsRepository;
    private final PartiesRepository partiesRepository;

    public BeamInwardService(BeamInwardRepository beamInwardRepository,
                             SizingSetRepository sizingSetRepository,
                             FabricOrderRepository fabricOrderRepository,
                             SizingUnitRepository sizingUnitRepository,
                             YarnCountRepository yarnCountRepository,
                             TickitsRepository tickitsRepository,
                             PartiesRepository partiesRepository) {
        this.beamInwardRepository = beamInwardRepository;
        this.sizingSetRepository = sizingSetRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.sizingUnitRepository = sizingUnitRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.tickitsRepository = tickitsRepository;
        this.partiesRepository = partiesRepository;
    }

    public List<BeamInward> getAll() {
        return beamInwardRepository.findAll();
    }

    public BeamInward getById(Long id) {
        return beamInwardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("BeamInward not found with id: " + id));
    }

    public List<BeamInward> getByOrder(Long orderId) {
        return beamInwardRepository.findByOrderOrderId(orderId);
    }

    public List<BeamInward> getBySizingSet(Long sizingSetId) {
        return beamInwardRepository.findBySizingSetSizingSetId(sizingSetId);
    }

    public BeamInward create(BeamInwardDto request) {
        BeamInward b = new BeamInward();

        if (request.getSizingSetId() != null) {
            SizingSet set = sizingSetRepository.findById(request.getSizingSetId())
                    .orElseThrow(() -> new RuntimeException("Sizing set not found: " + request.getSizingSetId()));
            b.setSizingSet(set);
        }

        if (request.getOrderId() != null) {
            FabricOrder order = fabricOrderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found: " + request.getOrderId()));
            b.setOrder(order);
        }

        if (request.getSizingId() != null) {
            SizingUnit sizing = sizingUnitRepository.findById(request.getSizingId())
                    .orElseThrow(() -> new RuntimeException("Sizing unit not found: " + request.getSizingId()));
            b.setSizingUnit(sizing);
        }

        mapTransactionFields(request, b);

        return beamInwardRepository.save(b);
    }

    public BeamInward update(Long id, BeamInwardDto request) {
        BeamInward b = getById(id);

        if (request.getSizingSetId() != null) {
            SizingSet set = sizingSetRepository.findById(request.getSizingSetId())
                    .orElseThrow(() -> new RuntimeException("Sizing set not found: " + request.getSizingSetId()));
            b.setSizingSet(set);
        }

        if (request.getOrderId() != null) {
            FabricOrder order = fabricOrderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found: " + request.getOrderId()));
            b.setOrder(order);
        }

        if (request.getSizingId() != null) {
            SizingUnit sizing = sizingUnitRepository.findById(request.getSizingId())
                    .orElseThrow(() -> new RuntimeException("Sizing unit not found: " + request.getSizingId()));
            b.setSizingUnit(sizing);
        }

        mapTransactionFields(request, b);

        return beamInwardRepository.save(b);
    }

    private void mapTransactionFields(BeamInwardDto request, BeamInward entity) {
        entity.setInwardDate(request.getInwardDate() != null ? request.getInwardDate() : LocalDate.now());
        entity.setBeamNo(request.getBeamNo());
        entity.setMeter(request.getMeter());
        entity.setWeightKg(request.getWeightKg());
        entity.setStatus(request.getStatus() == null || request.getStatus().isBlank() ? "OPEN" : request.getStatus());
        entity.setRemark(request.getRemark());

        if (request.getCountId() != null) {
            entity.setCount(yarnCountRepository.findById(request.getCountId())
                    .orElseThrow(() -> new RuntimeException("Yarn count not found: " + request.getCountId())));
        }
        if (request.getTickitId() != null) {
            entity.setTickit(tickitsRepository.findById(request.getTickitId())
                    .orElseThrow(() -> new RuntimeException("Tickit not found: " + request.getTickitId())));
        }
        if (request.getPartyId() != null) {
            entity.setParty(partiesRepository.findById(request.getPartyId())
                    .orElseThrow(() -> new RuntimeException("Party not found: " + request.getPartyId())));
        }
    }

    public void delete(Long id) {
        BeamInward b = getById(id);
        beamInwardRepository.delete(b);
    }
}
