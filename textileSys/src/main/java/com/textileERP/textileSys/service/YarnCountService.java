package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnCountDto;
import com.textileERP.textileSys.model.YarnCount;
import com.textileERP.textileSys.repository.YarnCountRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class YarnCountService {

    private final YarnCountRepository yarnCountRepository;

    public YarnCountService(YarnCountRepository yarnCountRepository) {
        this.yarnCountRepository = yarnCountRepository;
    }

    // Get all active yarn counts
    public List<YarnCount> getAllYarnCounts() {
        return yarnCountRepository.findByActiveTrue();
    }

    // Get yarn count by ID
    public YarnCount getYarnCountById(Long id) {
        return yarnCountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn count not found with id: " + id));
    }

    // Create yarn count
    public YarnCount createYarnCount(YarnCountDto request) {
        if (yarnCountRepository.existsByCountNameIgnoreCase(request.getCountName())) {
            throw new RuntimeException("Yarn count already exists with name: " + request.getCountName());
        }

        YarnCount yarnCount = new YarnCount();
        yarnCount.setCountName(request.getCountName());
        yarnCount.setCountType(request.getCountType());
        yarnCount.setDescription(request.getDescription());
        yarnCount.setActive(true);

        return yarnCountRepository.save(yarnCount);
    }

    // Update yarn count
    public YarnCount updateYarnCount(Long id, YarnCountDto request) {
        YarnCount yarnCount = getYarnCountById(id);

        if (yarnCountRepository.existsByCountNameIgnoreCaseAndCountIdNot(request.getCountName(), id)) {
            throw new RuntimeException("Yarn count already exists with name: " + request.getCountName());
        }

        yarnCount.setCountName(request.getCountName());
        yarnCount.setCountType(request.getCountType());
        yarnCount.setDescription(request.getDescription());

        return yarnCountRepository.save(yarnCount);
    }

    // Soft delete yarn count
    public void deleteYarnCount(Long id) {
        YarnCount yarnCount = getYarnCountById(id);
        yarnCount.setActive(false);
        yarnCountRepository.save(yarnCount);
    }
}
