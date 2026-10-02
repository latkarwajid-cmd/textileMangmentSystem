package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.SizingYarnInwardDto;
import com.textileERP.textileSys.model.*;
import com.textileERP.textileSys.repository.*;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class SizingYarnInwardService {

    private final SizingYarnInwardRepository sizingYarnInwardRepository;
    private final SizingSetRepository sizingSetRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final SizingUnitRepository sizingUnitRepository;
    private final YarnCountRepository yarnCountRepository;
    private final TickitsRepository tickitsRepository;
    private final PartiesRepository partiesRepository;

    public SizingYarnInwardService(
            SizingYarnInwardRepository sizingYarnInwardRepository,
            SizingSetRepository sizingSetRepository,
            FabricOrderRepository fabricOrderRepository,
            SizingUnitRepository sizingUnitRepository,
            YarnCountRepository yarnCountRepository,
            TickitsRepository tickitsRepository,
            PartiesRepository partiesRepository
    ) {
        this.sizingYarnInwardRepository =
                sizingYarnInwardRepository;

        this.sizingSetRepository =
                sizingSetRepository;

        this.fabricOrderRepository =
                fabricOrderRepository;

        this.sizingUnitRepository =
                sizingUnitRepository;

        this.yarnCountRepository =
                yarnCountRepository;

        this.tickitsRepository =
                tickitsRepository;

        this.partiesRepository =
                partiesRepository;
    }

    // =========================================================
    // GET ALL
    // =========================================================

    public List<SizingYarnInward>
    getAllSizingYarnInwards() {

        return sizingYarnInwardRepository.findAll().stream()
                .filter(inward -> !Boolean.TRUE.equals(inward.getArchived()))
                .toList();
    }

    // Deduct sizing inward stock when it is issued to rewinding.
    @Transactional
    public SizingYarnInward issueYarn(Long sizingInwardId, BigDecimal givenBags) {
                return issueYarn(sizingInwardId, givenBags, null);
        }

        @Transactional
        public SizingYarnInward issueYarn(Long sizingInwardId, BigDecimal givenBags, BigDecimal givenWeightKg) {
        if (givenBags == null || givenBags.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Issued bags must be greater than zero.");
        }

        SizingYarnInward inward = getSizingYarnInwardById(sizingInwardId);
        BigDecimal availableBags = inward.getBags() == null ? BigDecimal.ZERO : inward.getBags();
        if (givenBags.compareTo(availableBags) > 0) {
            throw new RuntimeException("Only " + availableBags + " bags are available in sizing inward " + sizingInwardId);
        }

        BigDecimal availableWeight = inward.getWeightKg() == null ? BigDecimal.ZERO : inward.getWeightKg();
        if (givenWeightKg != null && (givenWeightKg.compareTo(BigDecimal.ZERO) < 0
                || givenWeightKg.compareTo(availableWeight) > 0)) {
            throw new RuntimeException("Issued weight must be between 0 and " + availableWeight + " kg.");
        }
        BigDecimal remainingBags = availableBags.subtract(givenBags);
        BigDecimal remainingWeight = givenWeightKg != null
                ? availableWeight.subtract(givenWeightKg)
                : availableBags.compareTo(BigDecimal.ZERO) > 0
                ? availableWeight.multiply(remainingBags).divide(availableBags, 3, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        inward.setBags(remainingBags);
        inward.setWeightKg(remainingWeight);
        return sizingYarnInwardRepository.save(inward);
    }

    @Transactional
    public SizingYarnInward restoreIssuedYarn(Long sizingInwardId, BigDecimal bags, BigDecimal weightKg) {
        SizingYarnInward inward = getSizingYarnInwardById(sizingInwardId);
        inward.setBags(value(inward.getBags()).add(value(bags)));
        inward.setWeightKg(value(inward.getWeightKg()).add(value(weightKg)));
        return sizingYarnInwardRepository.save(inward);
    }

    private BigDecimal value(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    // =========================================================
    // GET BY ID
    // =========================================================

    public SizingYarnInward
    getSizingYarnInwardById(Long id) {

        return sizingYarnInwardRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Sizing yarn inward entry not found with id: "
                                        + id
                        )
                );
    }

    // =========================================================
    // FILTERS
    // =========================================================

    public List<SizingYarnInward>
    getBySizingSetId(Long sizingSetId) {

        return sizingYarnInwardRepository
                .findBySizingSetSizingSetId(
                        sizingSetId
                ).stream().filter(inward -> !Boolean.TRUE.equals(inward.getArchived())).toList();
    }

    public List<SizingYarnInward>
    getByOrderId(Long orderId) {

        return sizingYarnInwardRepository
                .findByOrderOrderId(orderId).stream()
                .filter(inward -> !Boolean.TRUE.equals(inward.getArchived())).toList();
    }

    public List<SizingYarnInward>
    getBySizingUnitId(Long sizingId) {

        return sizingYarnInwardRepository
                .findBySizingUnitSizingId(sizingId).stream()
                .filter(inward -> !Boolean.TRUE.equals(inward.getArchived())).toList();
    }

    public List<SizingYarnInward>
    getByPartyId(Long partyId) {

        return sizingYarnInwardRepository
                .findByPartyPartyId(partyId).stream()
                .filter(inward -> !Boolean.TRUE.equals(inward.getArchived())).toList();
    }

    // =========================================================
    // CREATE
    // =========================================================

    @Transactional
    public SizingYarnInward createSizingYarnInward(
            SizingYarnInwardDto request
    ) {

        validateBags(request.getBags());

        SizingYarnInward entity =
                new SizingYarnInward();

        mapDtoToEntity(
                request,
                entity
        );

        return sizingYarnInwardRepository.save(
                entity
        );
    }

    // =========================================================
    // UPDATE
    // =========================================================

    @Transactional
    public SizingYarnInward updateSizingYarnInward(
            Long id,
            SizingYarnInwardDto request
    ) {

        validateBags(request.getBags());

        SizingYarnInward entity =
                getSizingYarnInwardById(id);

        /*
         * Do not allow editing stock of a Sizing Inward
         * that is already allocated to a Sizing Set.
         *
         * This prevents stock corruption.
         */
        if (entity.getSizingSet() != null
                && request.getBags() != null
                && request.getBags().compareTo(
                entity.getBags()
        ) != 0) {

            throw new RuntimeException(
                    "Cannot change bags because this Sizing Inward "
                            + "is already linked to a Sizing Set"
            );
        }

        mapDtoToEntity(
                request,
                entity
        );

        return sizingYarnInwardRepository.save(
                entity
        );
    }

    // =========================================================
    // DELETE
    // =========================================================

    @Transactional
    public void deleteSizingYarnInward(
            Long id
    ) {

        SizingYarnInward entity =
                getSizingYarnInwardById(id);

        entity.setArchived(true);
        sizingYarnInwardRepository.save(entity);
    }

    // =========================================================
    // MAP DTO
    // =========================================================

    private void mapDtoToEntity(
            SizingYarnInwardDto dto,
            SizingYarnInward entity
    ) {

        entity.setInwardDate(
                dto.getInwardDate() != null
                        ? dto.getInwardDate()
                        : LocalDate.now()
        );

        // -----------------------------------------------------
        // SIZING SET
        // -----------------------------------------------------

        if (dto.getSizingSetId() != null) {

            SizingSet sizingSet =
                    sizingSetRepository.findById(
                            dto.getSizingSetId()
                    ).orElseThrow(() ->
                            new RuntimeException(
                                    "Sizing set not found with id: "
                                            + dto.getSizingSetId()
                            )
                    );

            entity.setSizingSet(
                    sizingSet
            );

        } else {

            entity.setSizingSet(null);
        }

        // -----------------------------------------------------
        // ORDER
        // -----------------------------------------------------

        if (dto.getOrderNo() != null
                && !dto.getOrderNo().isBlank()) {

            FabricOrder order =
                    fabricOrderRepository
                            .findActiveByOrderNoIgnoreCase(
                                    dto.getOrderNo().trim()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Fabric order not found with order no: "
                                                    + dto.getOrderNo()
                                    )
                            );

            entity.setOrder(order);

        } else if (dto.getOrderId() != null) {

            FabricOrder order =
                    fabricOrderRepository.findById(
                            dto.getOrderId()
                    ).orElseThrow(() ->
                            new RuntimeException(
                                    "Fabric order not found with id: "
                                            + dto.getOrderId()
                            )
                    );

            entity.setOrder(order);

        } else {

            entity.setOrder(null);
        }

        // -----------------------------------------------------
        // SIZING UNIT
        // -----------------------------------------------------

        if (dto.getSizingId() != null) {

            SizingUnit sizingUnit =
                    sizingUnitRepository.findById(
                            dto.getSizingId()
                    ).orElseThrow(() ->
                            new RuntimeException(
                                    "Sizing unit not found with id: "
                                            + dto.getSizingId()
                            )
                    );

            entity.setSizingUnit(
                    sizingUnit
            );

        } else {

            entity.setSizingUnit(null);
        }

        // -----------------------------------------------------
        // COUNT
        // -----------------------------------------------------

        if (dto.getCountId() != null) {

            YarnCount count =
                    yarnCountRepository.findById(
                            dto.getCountId()
                    ).orElseThrow(() ->
                            new RuntimeException(
                                    "Yarn count not found with id: "
                                            + dto.getCountId()
                            )
                    );

            entity.setCount(count);

        } else {

            entity.setCount(null);
        }

        // -----------------------------------------------------
        // TICKIT
        // -----------------------------------------------------

        if (dto.getTickitId() != null) {

            Tickits tickit =
                    tickitsRepository.findById(
                            dto.getTickitId()
                    ).orElseThrow(() ->
                            new RuntimeException(
                                    "Tickit not found with id: "
                                            + dto.getTickitId()
                            )
                    );

            entity.setTickit(tickit);

        } else {

            entity.setTickit(null);
        }

        // -----------------------------------------------------
        // PARTY
        // -----------------------------------------------------

        if (dto.getPartyId() != null) {

            Parties party =
                    partiesRepository.findById(
                            dto.getPartyId()
                    ).orElseThrow(() ->
                            new RuntimeException(
                                    "Party not found with id: "
                                            + dto.getPartyId()
                            )
                    );

            entity.setParty(party);

        } else {

            entity.setParty(null);
        }

        // -----------------------------------------------------
        // STOCK
        // -----------------------------------------------------

        entity.setBags(
                dto.getBags()
        );

        entity.setWeightKg(
                dto.getWeightKg()
        );

        entity.setItemType(dto.getItemType());
        entity.setConesReturned(dto.getConesReturned());
        entity.setConesPerBag(dto.getConesPerBag());

        entity.setRemark(
                dto.getRemark()
        );
    }

    // =========================================================
    // VALIDATE BAGS
    // =========================================================

    private void validateBags(
            BigDecimal bags
    ) {

        if (bags == null) {

            throw new RuntimeException(
                    "Bags are required"
            );
        }

        if (bags.compareTo(BigDecimal.ZERO) <= 0) {

            throw new RuntimeException(
                    "Bags must be greater than 0"
            );
        }
    }
}
