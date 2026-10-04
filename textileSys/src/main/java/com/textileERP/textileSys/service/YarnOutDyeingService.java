package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnOutDyeingDto;
import com.textileERP.textileSys.model.*;
import com.textileERP.textileSys.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class YarnOutDyeingService {

    private final YarnOutDyeingRepository repository;
    private final SizingSetRepository sizingSetRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final YarnCountRepository yarnCountRepository;
    private final TickitsRepository tickitsRepository;
    private final SizingUnitRepository sizingUnitRepository;
    private final PartiesRepository partiesRepository;
    private final YarnInwardService yarnInwardService;
    private final SizingYarnInwardService sizingYarnInwardService;
    private final YarnReceiveDyeingRepository yarnReceiveDyeingRepository;

    public YarnOutDyeingService(
            YarnOutDyeingRepository repository,
            SizingSetRepository sizingSetRepository,
            FabricOrderRepository fabricOrderRepository,
            YarnCountRepository yarnCountRepository,
            TickitsRepository tickitsRepository,
            SizingUnitRepository sizingUnitRepository,
            PartiesRepository partiesRepository,
            YarnInwardService yarnInwardService,
            SizingYarnInwardService sizingYarnInwardService,
            YarnReceiveDyeingRepository yarnReceiveDyeingRepository) {
        this.repository = repository;
        this.sizingSetRepository = sizingSetRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.tickitsRepository = tickitsRepository;
        this.sizingUnitRepository = sizingUnitRepository;
        this.partiesRepository = partiesRepository;
        this.yarnInwardService = yarnInwardService;
        this.sizingYarnInwardService = sizingYarnInwardService;
        this.yarnReceiveDyeingRepository = yarnReceiveDyeingRepository;
    }

    public List<YarnOutDyeing> getAll() {
        return repository.findAll().stream()
                .filter(issue -> !Boolean.TRUE.equals(issue.getArchived()))
                .toList();
    }

    public YarnOutDyeing getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn out dyeing entry not found with id: " + id));
    }

    public List<YarnOutDyeing> getBySizingSet(Long sizingSetId) {
        return repository.findBySizingSetSizingSetId(sizingSetId).stream()
                .filter(issue -> !Boolean.TRUE.equals(issue.getArchived())).toList();
    }

    public List<YarnOutDyeing> getByOrder(Long orderId) {
        return repository.findByOrderOrderId(orderId).stream()
                .filter(issue -> !Boolean.TRUE.equals(issue.getArchived())).toList();
    }

    @Transactional
    public YarnOutDyeing create(YarnOutDyeingDto request) {
        if (request.getGatePassNo() == null || request.getGatePassNo().isBlank()) {
            throw new RuntimeException("Gate pass number is required for a dyeing issue");
        }
        YarnOutDyeing entity = new YarnOutDyeing();
        map(request, entity);
        issueStock(request);
        return repository.save(entity);
    }

    @Transactional
    public List<YarnOutDyeing> createBatch(List<YarnOutDyeingDto> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new RuntimeException("At least one yarn stock row must be selected");
        }
        return requests.stream().map(this::create).toList();
    }

    @Transactional
    public YarnOutDyeing update(Long id, YarnOutDyeingDto request) {
        YarnOutDyeing entity = getById(id);
        boolean stockChanged = !Objects.equals(entity.getYarnInwardId(), request.getYarnInwardId())
                || !Objects.equals(entity.getSizingInwardId(), request.getSizingInwardId())
                || !sameAmount(entity.getBags(), request.getBags())
                || !sameAmount(entity.getCone(), request.getCone())
                || !sameAmount(entity.getWeightKg(), request.getWeightKg());
        if (stockChanged && hasReceipts(id)) {
            throw new RuntimeException("Stock quantities cannot be changed after yarn has been received from dyeing");
        }
        if (stockChanged) restoreStock(entity);
        map(request, entity);
        if (stockChanged && (request.getYarnInwardId() != null || request.getSizingInwardId() != null)) issueStock(request);
        return repository.save(entity);
    }

    @Transactional
    public void delete(Long id) {
        YarnOutDyeing entity = getById(id);
        yarnReceiveDyeingRepository.findByYarnOutDyeingDyeingOutId(id).forEach(receipt ->
                yarnInwardService.archiveYarnInwardByBillNo(
                        receipt.getGatePassNo() + "-DYED-" + receipt.getYarnReceiveDyeingId()
                )
        );
        if (!hasReceipts(id)) {
            restoreStock(entity);
        }
        entity.setArchived(true);
        repository.save(entity);
    }

    private void map(YarnOutDyeingDto dto, YarnOutDyeing entity) {
        entity.setGatePassNo(dto.getGatePassNo());
        entity.setYarnInwardId(dto.getYarnInwardId());
        entity.setSizingInwardId(dto.getSizingInwardId());
        entity.setSetNo(dto.getSetNo());
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
        entity.setTargetShade(dto.getTargetShade());
        entity.setDyeingType(dto.getDyeingType() == null || dto.getDyeingType().isBlank()
            ? "Cone Dyeing" : dto.getDyeingType());
        entity.setStatus("Active at Dyeing Unit");
    }

    private void issueStock(YarnOutDyeingDto request) {
        boolean yarnSource = request.getYarnInwardId() != null;
        boolean sizingSource = request.getSizingInwardId() != null;
        if (yarnSource == sizingSource) {
            throw new RuntimeException("Select exactly one yarn stock source for dyeing issue");
        }
        if (request.getBags() == null || request.getBags().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Issued bags must be greater than zero");
        }
        if (yarnSource) {
            yarnInwardService.issueYarn(request.getYarnInwardId(), request.getBags(), value(request.getCone()));
        } else {
            sizingYarnInwardService.issueYarn(request.getSizingInwardId(), request.getBags());
        }
    }

    private void restoreStock(YarnOutDyeing entity) {
        if (entity.getYarnInwardId() != null) {
            yarnInwardService.restoreIssuedYarn(entity.getYarnInwardId(), entity.getBags(), entity.getCone(), entity.getWeightKg());
        } else if (entity.getSizingInwardId() != null) {
            sizingYarnInwardService.restoreIssuedYarn(entity.getSizingInwardId(), entity.getBags(), entity.getWeightKg());
        }
    }

    private BigDecimal value(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private boolean sameAmount(BigDecimal left, BigDecimal right) {
        return left == null ? right == null : right != null && left.compareTo(right) == 0;
    }

    private boolean hasReceipts(Long dyeingOutId) {
        return !yarnReceiveDyeingRepository.findByYarnOutDyeingDyeingOutId(dyeingOutId).isEmpty();
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
