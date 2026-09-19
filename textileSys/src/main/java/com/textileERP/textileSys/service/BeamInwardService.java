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
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class BeamInwardService {

    private final BeamInwardRepository beamInwardRepository;
    private final SizingSetRepository sizingSetRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final SizingUnitRepository sizingUnitRepository;

    public BeamInwardService(BeamInwardRepository beamInwardRepository,
                             SizingSetRepository sizingSetRepository,
                             FabricOrderRepository fabricOrderRepository,
                             SizingUnitRepository sizingUnitRepository) {
        this.beamInwardRepository = beamInwardRepository;
        this.sizingSetRepository = sizingSetRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.sizingUnitRepository = sizingUnitRepository;
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

        b.setDate(request.getDate() != null ? request.getDate() : LocalDate.now());
        b.setBeams(request.getBeams());
        b.setDNo(request.getDNo());
        b.setCut(request.getCut());
        b.setMtrs(request.getMtrs());
        b.setPick(request.getPick());
        b.setFold(request.getFold());
        b.setRs(request.getRs());
        b.setLasa(request.getLasa());

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

        if (request.getDate() != null) b.setDate(request.getDate());
        if (request.getBeams() != null) b.setBeams(request.getBeams());
        b.setDNo(request.getDNo());
        if (request.getCut() != null) b.setCut(request.getCut());
        if (request.getMtrs() != null) b.setMtrs(request.getMtrs());
        if (request.getPick() != null) b.setPick(request.getPick());
        if (request.getFold() != null) b.setFold(request.getFold());
        if (request.getRs() != null) b.setRs(request.getRs());
        if (request.getLasa() != null) b.setLasa(request.getLasa());

        return beamInwardRepository.save(b);
    }

    public void delete(Long id) {
        BeamInward b = getById(id);
        beamInwardRepository.delete(b);
    }
}
