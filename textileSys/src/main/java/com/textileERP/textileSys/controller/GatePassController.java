package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.ActiveYarnGatePassDto;
import com.textileERP.textileSys.model.YarnInward;
import com.textileERP.textileSys.repository.YarnInwardRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/gate-passes")
@CrossOrigin(origins = "*")
public class GatePassController {

    private final YarnInwardRepository yarnInwardRepository;

    public GatePassController(YarnInwardRepository yarnInwardRepository) {
        this.yarnInwardRepository = yarnInwardRepository;
    }

    @GetMapping("/active-yarn")
    public ResponseEntity<List<ActiveYarnGatePassDto>> getActiveYarn() {
        List<ActiveYarnGatePassDto> lots = yarnInwardRepository.findAll().stream()
                .sorted(Comparator
                        .comparing(YarnInward::getInwardDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(YarnInward::getYarnInwardId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(lots);
    }

    private ActiveYarnGatePassDto toDto(YarnInward inward) {
        ActiveYarnGatePassDto dto = new ActiveYarnGatePassDto();
        dto.setYarnInwardId(inward.getYarnInwardId());
        dto.setInwardDate(inward.getInwardDate());
        dto.setBillNo(inward.getBillNo());
        dto.setOrderNo(inward.getOrder() != null ? inward.getOrder().getOrderNo() : null);
        dto.setSupplierName(inward.getSupplier() != null ? inward.getSupplier().getPartyName() : null);
        dto.setCountId(inward.getCount() != null ? inward.getCount().getCountId() : null);
        dto.setCountName(inward.getCount() != null ? inward.getCount().getCountName() : null);
        dto.setTickitId(inward.getTickit() != null ? inward.getTickit().getTickitId() : null);
        dto.setTickitName(inward.getTickit() != null ? inward.getTickit().getTickitName() : null);
        dto.setBags(inward.getBags());
        dto.setWeightKg(inward.getWeightKg());
        return dto;
    }
}
