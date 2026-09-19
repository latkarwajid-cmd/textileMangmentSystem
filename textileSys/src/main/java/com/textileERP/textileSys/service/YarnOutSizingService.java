package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnOutSizingDto;
import com.textileERP.textileSys.model.SizingSet;
import com.textileERP.textileSys.model.YarnOutSizing;
import com.textileERP.textileSys.repository.SizingSetRepository;
import com.textileERP.textileSys.repository.YarnOutSizingRepository;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class YarnOutSizingService {

    private final YarnOutSizingRepository yarnOutSizingRepository;
    private final SizingSetRepository sizingSetRepository;

    public YarnOutSizingService(
            YarnOutSizingRepository yarnOutSizingRepository,
            SizingSetRepository sizingSetRepository) {
        this.yarnOutSizingRepository = yarnOutSizingRepository;
        this.sizingSetRepository = sizingSetRepository;
    }

    // Get all entries
    public List<YarnOutSizing> getAllYarnOutSizing() {
        return yarnOutSizingRepository.findAll();
    }

    // Get by ID
    public YarnOutSizing getYarnOutSizingById(Long id) {
        return yarnOutSizingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn out sizing entry not found with id: " + id));
    }

    // Get by Sizing Set ID
    public List<YarnOutSizing> getYarnOutSizingBySizingSetId(Long sizingSetId) {
        return yarnOutSizingRepository.findBySizingSetSizingSetId(sizingSetId);
    }

    // Create entry
    public YarnOutSizing createYarnOutSizing(YarnOutSizingDto request) {
        YarnOutSizing yarnOutSizing = new YarnOutSizing();
        mapDtoToEntity(request, yarnOutSizing);
        return yarnOutSizingRepository.save(yarnOutSizing);
    }

    // Update entry
    public YarnOutSizing updateYarnOutSizing(Long id, YarnOutSizingDto request) {
        YarnOutSizing yarnOutSizing = getYarnOutSizingById(id);
        mapDtoToEntity(request, yarnOutSizing);
        return yarnOutSizingRepository.save(yarnOutSizing);
    }

    // Delete entry
    public void deleteYarnOutSizing(Long id) {
        YarnOutSizing yarnOutSizing = getYarnOutSizingById(id);
        yarnOutSizingRepository.delete(yarnOutSizing);
    }

    private void mapDtoToEntity(YarnOutSizingDto dto, YarnOutSizing entity) {
        if (dto.getSizingSetId() == null) {
            throw new RuntimeException("Sizing Set ID is required");
        }

        SizingSet sizingSet = sizingSetRepository.findById(dto.getSizingSetId())
                .orElseThrow(() -> new RuntimeException("Sizing set not found with id: " + dto.getSizingSetId()));
        entity.setSizingSet(sizingSet);

        if (dto.getOutDate() != null) {
            entity.setOutDate(dto.getOutDate());
        } else if (entity.getOutDate() == null) {
            entity.setOutDate(LocalDate.now());
        }

        entity.setBags(dto.getBags());
        entity.setCone(dto.getCone());
        entity.setWeightKg(dto.getWeightKg());
        entity.setRate(dto.getRate());
        entity.setBillNo(dto.getBillNo());

        // Calculate amount if not provided and weight & rate are present
        if (dto.getAmount() != null) {
            entity.setAmount(dto.getAmount());
        } else if (dto.getWeightKg() != null && dto.getRate() != null) {
            entity.setAmount(dto.getWeightKg().multiply(dto.getRate()).setScale(2, RoundingMode.HALF_UP));
        }
    }
}
