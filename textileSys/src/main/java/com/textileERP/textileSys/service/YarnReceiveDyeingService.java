package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnReceiveDyeingDto;
import com.textileERP.textileSys.model.YarnReceiveDyeing;
import com.textileERP.textileSys.repository.YarnOutDyeingRepository;
import com.textileERP.textileSys.repository.YarnReceiveDyeingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

@Service
public class YarnReceiveDyeingService {

    private final YarnReceiveDyeingRepository repository;
    private final YarnOutDyeingRepository yarnOutDyeingRepository;
    private final YarnInwardService yarnInwardService;

    public YarnReceiveDyeingService(YarnReceiveDyeingRepository repository, YarnOutDyeingRepository yarnOutDyeingRepository, YarnInwardService yarnInwardService) {
        this.repository = repository;
        this.yarnOutDyeingRepository = yarnOutDyeingRepository;
        this.yarnInwardService = yarnInwardService;
    }

    public List<YarnReceiveDyeing> getAll() {
        return repository.findAll();
    }

    public YarnReceiveDyeing create(YarnReceiveDyeingDto request) {
        YarnReceiveDyeing entity = new YarnReceiveDyeing();
        map(request, entity);
        YarnReceiveDyeing saved = repository.save(entity);
        creditInventory(saved);
        updateIssueStatus(saved.getYarnOutDyeing());
        return saved;
    }

    public YarnReceiveDyeing update(Long id, YarnReceiveDyeingDto request) {
        YarnReceiveDyeing entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn receive from dyeing entry not found with id: " + id));
        map(request, entity);
        YarnReceiveDyeing saved = repository.save(entity);
        updateIssueStatus(saved.getYarnOutDyeing());
        return saved;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private void map(YarnReceiveDyeingDto dto, YarnReceiveDyeing entity) {
        var issue = yarnOutDyeingRepository.findById(dto.getDyeingOutId())
            .orElseThrow(() -> new RuntimeException("Yarn issue to dyeing entry not found"));
        BigDecimal alreadyConsumed = repository.findByYarnOutDyeingDyeingOutId(dto.getDyeingOutId()).stream()
                .filter(receipt -> !receipt.getYarnReceiveDyeingId().equals(entity.getYarnReceiveDyeingId()))
                .map(receipt -> value(receipt.getReceivedWeight()).add(value(receipt.getWastage())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal requested = value(dto.getReceivedWeight()).add(value(dto.getWastage()));
        if (issue.getWeightKg() != null && alreadyConsumed.add(requested).compareTo(issue.getWeightKg()) > 0) {
            throw new IllegalArgumentException("Received weight plus wastage cannot exceed the remaining issued weight");
        }
        entity.setYarnOutDyeing(issue);
        entity.setGatePassNo(dto.getGatePassNo());
        entity.setReceiveDate(dto.getReceiveDate() == null ? LocalDate.now() : dto.getReceiveDate());
        entity.setPartyGatePassNo(dto.getPartyGatePassNo());
        entity.setReceivedWeight(dto.getReceivedWeight());
        entity.setWastage(dto.getWastage());
        entity.setRemarks(dto.getRemarks());
        entity.setTargetShade(dto.getTargetShade() == null ? issue.getTargetShade() : dto.getTargetShade());
    }

    private void updateIssueStatus(com.textileERP.textileSys.model.YarnOutDyeing issue) {
        BigDecimal total = repository.findByYarnOutDyeingDyeingOutId(issue.getDyeingOutId()).stream()
                .map(receipt -> value(receipt.getReceivedWeight()).add(value(receipt.getWastage())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        issue.setStatus(issue.getWeightKg() != null
                && issue.getWeightKg().subtract(total).compareTo(BigDecimal.ZERO) <= 0.000001
                ? "COMPLETED" : "PARTIAL");
        yarnOutDyeingRepository.save(issue);
    }

    private void creditInventory(YarnReceiveDyeing receipt) {
        BigDecimal received = value(receipt.getReceivedWeight());
        if (received.signum() <= 0) return;
        var issue = receipt.getYarnOutDyeing();
        var inventory = new com.textileERP.textileSys.dto.YarnInwardDto();
        inventory.setInwardDate(receipt.getReceiveDate());
        inventory.setOriginalBags(received);
        inventory.setBags(received);
        inventory.setType("DYED");
        inventory.setWeightKg(received);
        inventory.setWeightPerBag(BigDecimal.ONE);
        inventory.setCountId(issue.getCount() == null ? null : issue.getCount().getCountId());
        inventory.setTickitId(issue.getTickit() == null ? null : issue.getTickit().getTickitId());
        inventory.setBillNo(receipt.getGatePassNo() + "-DYED-" + receipt.getYarnReceiveDyeingId());
        inventory.setTargetShade(receipt.getTargetShade() != null ? receipt.getTargetShade() : issue.getTargetShade());
        inventory.setInventoryStatus("Active at Dyeing Unit");
        inventory.setRemark("Received from dyeing gatepass " + receipt.getGatePassNo());
        yarnInwardService.createYarnInward(inventory);
    }

    private BigDecimal value(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }
}
