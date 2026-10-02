package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.RewindingYarnReceiveDto;
import com.textileERP.textileSys.dto.RewindingYarnReceiveLineDto;
import com.textileERP.textileSys.model.RewindingIssue;
import com.textileERP.textileSys.model.RewindingYarnReceive;
import com.textileERP.textileSys.model.RewindingYarnReceiveLine;
import com.textileERP.textileSys.model.RewindingStatus;
import com.textileERP.textileSys.model.YarnInward;
import com.textileERP.textileSys.repository.RewindingIssueRepository;
import com.textileERP.textileSys.repository.RewindingYarnReceiveRepository;
import com.textileERP.textileSys.repository.YarnStorageLocationRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Locale;

@Service
public class RewindingYarnReceiveService {
    private final RewindingIssueRepository issueRepository;
    private final RewindingYarnReceiveRepository receiveRepository;
    private final YarnInwardService yarnInwardService;
    private final YarnStorageLocationRepository storageLocationRepository;

    public RewindingYarnReceiveService(
            RewindingIssueRepository issueRepository,
            RewindingYarnReceiveRepository receiveRepository,
            YarnInwardService yarnInwardService,
            YarnStorageLocationRepository storageLocationRepository) {
        this.issueRepository = issueRepository;
        this.receiveRepository = receiveRepository;
        this.yarnInwardService = yarnInwardService;
        this.storageLocationRepository = storageLocationRepository;
    }

    public RewindingIssue getIssue(String getpassNo) {
        return issueRepository.findByGetpassNoIgnoreCase(getpassNo)
                .filter(issue -> !Boolean.TRUE.equals(issue.getArchived()))
                .orElseThrow(() -> new RuntimeException("Rewinding getpass not found: " + getpassNo));
    }

    public RewindingYarnReceive getByGetpass(String getpassNo) {
        return receiveRepository.findByRewindingIssueGetpassNoIgnoreCase(getpassNo)
                .filter(receive -> receive.getRewindingIssue() != null
                        && !Boolean.TRUE.equals(receive.getRewindingIssue().getArchived()))
                .orElseThrow(() -> new RuntimeException("No yarn receipt found for getpass: " + getpassNo));
    }

    @Transactional
    public RewindingYarnReceive complete(RewindingYarnReceiveDto dto) {
        if (dto == null || dto.getGetpassNo() == null || dto.getGetpassNo().isBlank()) {
            throw new RuntimeException("Getpass number is required");
        }
        if (dto.getLines() == null || dto.getLines().isEmpty()) {
            throw new RuntimeException("At least one received yarn row is required");
        }

        RewindingIssue issue = getIssue(dto.getGetpassNo().trim());
        if (issue.getStatus() == RewindingStatus.COMPLETED
                || receiveRepository.findByRewindingIssueGetpassNoIgnoreCase(issue.getGetpassNo()).isPresent()) {
            throw new RuntimeException("This rewinding getpass is already completed");
        }

        BigDecimal issuedWeight = issue.getLines().stream()
                .map(line -> value(line.getWeightKg()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal receivedWeight = dto.getLines().stream()
                .map(line -> validateLine(line).getGrossWeightKg())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal scrapWeight = value(dto.getScrapWeightKg());
        BigDecimal balanceWeight = value(dto.getBalanceReturnWeightKg());
        if (scrapWeight.signum() < 0 || balanceWeight.signum() < 0
                || receivedWeight.add(scrapWeight).add(balanceWeight).compareTo(issuedWeight) > 0) {
            throw new RuntimeException("Received, scrap and balance return weight cannot exceed issued weight");
        }

        RewindingYarnReceive receive = new RewindingYarnReceive();
        receive.setRewindingIssue(issue);
        receive.setReceiveDate(dto.getReceiveDate() == null ? LocalDate.now() : dto.getReceiveDate());
        receive.setReturnedEmptyCones(value(dto.getReturnedEmptyCones()));
        receive.setScrapWeightKg(scrapWeight);
        receive.setBalanceReturnWeightKg(balanceWeight);
        receive.setLines(new ArrayList<>());

        for (RewindingYarnReceiveLineDto lineDto : dto.getLines()) {
            RewindingYarnReceiveLineDto line = validateLine(lineDto);
            String packageType = line.getPackageType().toUpperCase(Locale.ROOT);
            BigDecimal packages = line.getPackagesCount();
            BigDecimal weight = line.getGrossWeightKg();

                com.textileERP.textileSys.dto.YarnInwardDto inventoryDto = new com.textileERP.textileSys.dto.YarnInwardDto();
                inventoryDto.setInwardDate(receive.getReceiveDate());
                inventoryDto.setOriginalBags(packages);
                inventoryDto.setBags(packages);
                inventoryDto.setType("REWOUND");
                inventoryDto.setWeightKg(weight);
                inventoryDto.setWeightPerBag(packages.signum() > 0
                    ? weight.divide(packages, 6, java.math.RoundingMode.HALF_UP)
                    : BigDecimal.ZERO);
                inventoryDto.setStorageLocationId(storageLocationRepository.findByLocationNameIgnoreCase(
                    line.getDestinationWarehouse() == null ? "Main Raw Yarn Warehouse" : line.getDestinationWarehouse())
                    .map(x -> x.getStorageLocationId()).orElse(null));
                inventoryDto.setBillNo(issue.getGetpassNo() + "-" + receive.getLines().size());
                inventoryDto.setOriginalYCone(packageType.equals("CONES") ? packages : BigDecimal.ZERO);
                inventoryDto.setYCone(packageType.equals("CONES") ? packages : BigDecimal.ZERO);
                inventoryDto.setRemark(line.getCountAndTicket());
                inventoryDto.setRemark2("Rewound yarn received from " + issue.getGetpassNo());
                YarnInward inventory = yarnInwardService.createYarnInward(inventoryDto);

            RewindingYarnReceiveLine entityLine = new RewindingYarnReceiveLine();
            entityLine.setReceive(receive);
            entityLine.setPackageType(packageType);
            entityLine.setCountAndTicket(line.getCountAndTicket());
            entityLine.setPackagesCount(packages);
            entityLine.setGrossWeightKg(weight);
            entityLine.setDestinationWarehouse(line.getDestinationWarehouse());
            entityLine.setRemark(line.getRemark());
            entityLine.setInventoryYarnInwardId(inventory.getYarnInwardId());
            receive.getLines().add(entityLine);
        }

        issue.setStatus(RewindingStatus.COMPLETED);
        return receiveRepository.save(receive);
    }

    private RewindingYarnReceiveLineDto validateLine(RewindingYarnReceiveLineDto line) {
        if (line == null || line.getPackageType() == null || line.getPackageType().isBlank()) {
            throw new RuntimeException("Received package type is required");
        }
        if (line.getPackagesCount() == null || line.getPackagesCount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Packages count must be greater than zero");
        }
        if (line.getGrossWeightKg() == null || line.getGrossWeightKg().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Received gross weight must be greater than zero");
        }
        return line;
    }

    private BigDecimal value(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }
}
