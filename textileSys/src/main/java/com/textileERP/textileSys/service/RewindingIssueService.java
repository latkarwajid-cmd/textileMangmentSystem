package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.RewindingIssueDto;
import com.textileERP.textileSys.dto.RewindingIssueLineDto;
import com.textileERP.textileSys.model.RewindingIssue;
import com.textileERP.textileSys.model.RewindingIssueLine;
import com.textileERP.textileSys.repository.RewindingIssueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class RewindingIssueService {

    private final RewindingIssueRepository repository;
    private final YarnInwardService yarnInwardService;
    private final SizingYarnInwardService sizingYarnInwardService;

    public RewindingIssueService(RewindingIssueRepository repository, YarnInwardService yarnInwardService,
                                 SizingYarnInwardService sizingYarnInwardService) {
        this.repository = repository;
        this.yarnInwardService = yarnInwardService;
        this.sizingYarnInwardService = sizingYarnInwardService;
    }

    public List<RewindingIssue> getAll() {
        return repository.findAll();
    }

    public RewindingIssue getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rewinding issue not found with id: " + id));
    }

    public RewindingIssue getByGetpassNo(String getpassNo) {
        if (getpassNo == null || getpassNo.isBlank()) {
            throw new RuntimeException("Getpass number is required");
        }
        return repository.findByGetpassNoIgnoreCase(getpassNo)
                .orElseThrow(() -> new RuntimeException("Rewinding issue not found for getpass: " + getpassNo));
    }

    @Transactional
    public RewindingIssue create(RewindingIssueDto dto) {
        validate(dto, null);
        RewindingIssue entity = new RewindingIssue();
        apply(dto, entity);
        return repository.save(entity);
    }

    @Transactional
    public RewindingIssue update(Long id, RewindingIssueDto dto) {
        RewindingIssue entity = getById(id);
        validate(dto, id);
        restoreLines(entity);
        apply(dto, entity);
        return repository.save(entity);
    }

    @Transactional
    public void delete(Long id) {
        RewindingIssue entity = getById(id);
        restoreLines(entity);
        repository.delete(entity);
    }

    private void validate(RewindingIssueDto dto, Long ignoredId) {
        if (dto == null) {
            throw new RuntimeException("Request body is required");
        }
        if (dto.getGetpassNo() == null || dto.getGetpassNo().isBlank()) {
            throw new RuntimeException("Getpass number is required");
        }
        if (dto.getFirmName() == null || dto.getFirmName().isBlank()) {
            throw new RuntimeException("Firm name is required");
        }
        if (dto.getIssueDate() == null) {
            throw new RuntimeException("Issue date is required");
        }
        if (dto.getRewindingName() == null || dto.getRewindingName().isBlank()) {
            throw new RuntimeException("Rewinding name is required");
        }

        if (dto.getLines() == null || dto.getLines().isEmpty()) {
            throw new RuntimeException("At least one yarn line is required");
        }

        if (repository.existsByGetpassNoIgnoreCase(dto.getGetpassNo())
                && (ignoredId == null || !repository.findByGetpassNoIgnoreCase(dto.getGetpassNo())
                .map(existing -> existing.getRewindingIssueId().equals(ignoredId)).orElse(false))) {
            throw new RuntimeException("This getpass number already exists");
        }
    }

    private void restoreLines(RewindingIssue entity) {
        for (RewindingIssueLine line : entity.getLines()) {
            if (line.getYarnInwardId() != null) {
                yarnInwardService.restoreIssuedYarn(
                        line.getYarnInwardId(),
                        line.getBags(),
                        line.getCone(),
                        line.getWeightKg()
                );
            } else if (line.getSizingInwardId() != null) {
                sizingYarnInwardService.restoreIssuedYarn(
                        line.getSizingInwardId(),
                        line.getBags(),
                        line.getWeightKg()
                );
            }
        }
    }

    private void apply(RewindingIssueDto dto, RewindingIssue entity) {
        entity.setGetpassNo(dto.getGetpassNo().trim());
        entity.setFirmName(dto.getFirmName().trim());
        entity.setIssueDate(dto.getIssueDate());
        entity.setRewindingName(dto.getRewindingName().trim());
        entity.setRemark(dto.getRemark());

        List<RewindingIssueLine> lines = new ArrayList<>();
        for (RewindingIssueLineDto lineDto : dto.getLines()) {
            boolean hasYarnInward = lineDto.getYarnInwardId() != null;
            boolean hasSizingInward = lineDto.getSizingInwardId() != null;
            if (hasYarnInward == hasSizingInward) {
                throw new RuntimeException("Each rewind line must include exactly one yarn or sizing inward source id");
            }

            if (lineDto.getBags() == null || lineDto.getBags().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Issued bags must be greater than zero");
            }

            if (lineDto.getCone() == null || lineDto.getCone().compareTo(java.math.BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Issued cones cannot be negative for yarn inward id: " + lineDto.getYarnInwardId());
            }

            if (hasYarnInward) {
                yarnInwardService.issueYarn(lineDto.getYarnInwardId(), lineDto.getBags(), lineDto.getCone(), lineDto.getWeightKg());
            } else {
                sizingYarnInwardService.issueYarn(lineDto.getSizingInwardId(), lineDto.getBags(), lineDto.getWeightKg());
            }

            RewindingIssueLine line = new RewindingIssueLine();
            line.setRewindingIssue(entity);
            line.setYarnInwardId(lineDto.getYarnInwardId());
            line.setSizingInwardId(lineDto.getSizingInwardId());
            line.setSetNo(lineDto.getSetNo());
            line.setSeNo(lineDto.getSeNo());
            line.setCountName(lineDto.getCountName());
            line.setTickitName(lineDto.getTickitName());
            line.setBags(lineDto.getBags());
            line.setCone(lineDto.getCone());
            line.setWeightKg(lineDto.getWeightKg());
            line.setTargetOutputType(lineDto.getTargetOutputType());
            line.setRemark(lineDto.getRemark());
            lines.add(line);
        }
        entity.getLines().clear();
        entity.getLines().addAll(lines);
    }
}
