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

    public YarnReceiveDyeingService(YarnReceiveDyeingRepository repository, YarnOutDyeingRepository yarnOutDyeingRepository) {
        this.repository = repository;
        this.yarnOutDyeingRepository = yarnOutDyeingRepository;
    }

    public List<YarnReceiveDyeing> getAll() {
        return repository.findAll();
    }

    public YarnReceiveDyeing create(YarnReceiveDyeingDto request) {
        YarnReceiveDyeing entity = new YarnReceiveDyeing();
        map(request, entity);
        return repository.save(entity);
    }

    public YarnReceiveDyeing update(Long id, YarnReceiveDyeingDto request) {
        YarnReceiveDyeing entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn receive from dyeing entry not found with id: " + id));
        map(request, entity);
        return repository.save(entity);
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
    }

    private BigDecimal value(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }
}
