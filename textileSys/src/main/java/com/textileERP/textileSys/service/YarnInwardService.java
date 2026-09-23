package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnInwardDto;
import com.textileERP.textileSys.model.*;
import com.textileERP.textileSys.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class YarnInwardService {

    private final YarnInwardRepository yarnInwardRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final YarnCountRepository yarnCountRepository;
    private final TickitsRepository tickitsRepository;
    private final PartiesRepository partiesRepository;
    private final YarnStorageLocationRepository yarnStorageLocationRepository;
    private final SizingUnitRepository sizingUnitRepository;

    public YarnInwardService(
            YarnInwardRepository yarnInwardRepository,
            FabricOrderRepository fabricOrderRepository,
            YarnCountRepository yarnCountRepository,
            TickitsRepository tickitsRepository,
            PartiesRepository partiesRepository,
            YarnStorageLocationRepository yarnStorageLocationRepository,
            SizingUnitRepository sizingUnitRepository) {

        this.yarnInwardRepository = yarnInwardRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.tickitsRepository = tickitsRepository;
        this.partiesRepository = partiesRepository;
        this.yarnStorageLocationRepository = yarnStorageLocationRepository;
        this.sizingUnitRepository = sizingUnitRepository;
    }

    // ============================================================
    // GET ALL
    // ============================================================

    public List<YarnInward> getAllYarnInwards() {
        return yarnInwardRepository.findAll();
    }

    // ============================================================
    // GET BY ID
    // ============================================================

    public YarnInward getYarnInwardById(Long id) {

        return yarnInwardRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Yarn inward entry not found with id: " + id
                        )
                );
    }

    // ============================================================
    // GET BY SUPPLIER
    // ============================================================

    public List<YarnInward> getYarnInwardsBySupplierId(
            Long supplierId) {

        return yarnInwardRepository
                .findBySupplierPartyId(supplierId);
    }

    // ============================================================
    // GET BY ORDER
    // ============================================================

    public List<YarnInward> getYarnInwardsByOrderId(
            Long orderId) {

        return yarnInwardRepository
                .findByOrderOrderId(orderId);
    }

    // ============================================================
    // GET BY PAYMENT STATUS
    // ============================================================

    public List<YarnInward> getYarnInwardsByPaymentStatus(
            String paymentStatus) {

        return yarnInwardRepository
                .findByPaymentStatusIgnoreCase(paymentStatus);
    }

    // ============================================================
    // CREATE
    // ============================================================

    public YarnInward createYarnInward(
            YarnInwardDto request) {

        YarnInward yarnInward =
                new YarnInward();

        mapDtoToEntity(
                request,
                yarnInward
        );

        return yarnInwardRepository.save(
                yarnInward
        );
    }

    // ============================================================
    // UPDATE
    // ============================================================

    public YarnInward updateYarnInward(
            Long id,
            YarnInwardDto request) {

        YarnInward yarnInward =
                getYarnInwardById(id);

        mapDtoToEntity(
                request,
                yarnInward
        );

        return yarnInwardRepository.save(
                yarnInward
        );
    }

    // ============================================================
    // ISSUE YARN
    // ============================================================

    @Transactional
    public YarnInward issueYarn(
            Long yarnInwardId,
            BigDecimal givenBags,
            BigDecimal givenCones) {

        // --------------------------------------------------------
        // Validate bags
        // --------------------------------------------------------

        if (givenBags == null
                || givenBags.compareTo(BigDecimal.ZERO) <= 0) {

            throw new RuntimeException(
                    "Issued bags must be greater than zero."
            );
        }

        // --------------------------------------------------------
        // Validate cones
        // --------------------------------------------------------

        if (givenCones == null
                || givenCones.compareTo(BigDecimal.ZERO) < 0) {

            throw new RuntimeException(
                    "Issued cones cannot be negative."
            );
        }

        YarnInward yarnInward =
                getYarnInwardById(
                        yarnInwardId
                );

        // --------------------------------------------------------
        // AVAILABLE BAGS
        // --------------------------------------------------------

        BigDecimal availableBags =
                yarnInward.getBags() == null
                        ? BigDecimal.ZERO
                        : yarnInward.getBags();

        if (availableBags.compareTo(
                BigDecimal.ZERO
        ) <= 0) {

            throw new RuntimeException(
                    "This Yarn Inward has no available bags left."
            );
        }

        if (givenBags.compareTo(
                availableBags
        ) > 0) {

            throw new RuntimeException(
                    "Only "
                            + availableBags
                            + " bags are available."
            );
        }

        // --------------------------------------------------------
        // AVAILABLE CONES
        // --------------------------------------------------------

        BigDecimal availableCone =
                yarnInward.getYCone() == null
                        ? BigDecimal.ZERO
                        : yarnInward.getYCone();

        if (givenCones.compareTo(
                availableCone
        ) > 0) {

            throw new RuntimeException(
                    "Only "
                            + availableCone
                            + " cones are available."
            );
        }

        // --------------------------------------------------------
        // STORE ORIGINAL VALUES
        // --------------------------------------------------------

        if (yarnInward.getOriginalBags() == null) {

            yarnInward.setOriginalBags(
                    availableBags
            );
        }

        if (yarnInward.getOriginalYCone() == null) {

            yarnInward.setOriginalYCone(
                    availableCone
            );
        }

        if (yarnInward.getOriginalWeightKg() == null) {

            yarnInward.setOriginalWeightKg(
                    yarnInward.getWeightKg() == null
                            ? BigDecimal.ZERO
                            : yarnInward.getWeightKg()
            );
        }

        // --------------------------------------------------------
        // REMAINING BAGS
        // --------------------------------------------------------

        BigDecimal remainingBags =
                availableBags.subtract(
                        givenBags
                );

        // --------------------------------------------------------
        // REMAINING CONES
        // --------------------------------------------------------

        BigDecimal remainingCone =
                availableCone.subtract(
                        givenCones
                );

        // --------------------------------------------------------
        // ISSUED BAGS
        // --------------------------------------------------------

        BigDecimal issuedBags =
                yarnInward
                        .getOriginalBags()
                        .subtract(
                                remainingBags
                        );

        // --------------------------------------------------------
        // REMAINING WEIGHT
        // --------------------------------------------------------

        BigDecimal remainingWeight = BigDecimal.ZERO;

        // Prefer explicit weightPerBag when available. Otherwise derive
        // weightPerBag from original weight or current weight and bags.
        BigDecimal wpb = yarnInward.getWeightPerBag();

        if (wpb == null) {
            if (yarnInward.getOriginalBags() != null
                    && yarnInward.getOriginalBags().compareTo(BigDecimal.ZERO) > 0
                    && yarnInward.getOriginalWeightKg() != null) {

                wpb = yarnInward.getOriginalWeightKg()
                        .divide(yarnInward.getOriginalBags(), 6, RoundingMode.HALF_UP);

            } else if (yarnInward.getBags() != null
                    && yarnInward.getBags().compareTo(BigDecimal.ZERO) > 0
                    && yarnInward.getWeightKg() != null) {

                wpb = yarnInward.getWeightKg()
                        .divide(yarnInward.getBags(), 6, RoundingMode.HALF_UP);

            } else {
                wpb = BigDecimal.ZERO;
            }
        }

        remainingWeight = wpb.multiply(remainingBags).setScale(3, RoundingMode.HALF_UP);

        // --------------------------------------------------------
        // SET REMAINING STOCK
        // --------------------------------------------------------

        yarnInward.setBags(
                remainingBags.setScale(
                        3,
                        RoundingMode.HALF_UP
                )
        );

        yarnInward.setYCone(
                remainingCone.setScale(
                        3,
                        RoundingMode.HALF_UP
                )
        );

        yarnInward.setWeightKg(
                remainingWeight.setScale(
                        3,
                        RoundingMode.HALF_UP
                )
        );

        // --------------------------------------------------------
        // TYPE
        // --------------------------------------------------------

        if (issuedBags.compareTo(
                BigDecimal.ZERO
        ) > 0) {

            yarnInward.setType("USED");

        } else {

            yarnInward.setType("FRESH");
        }

        return yarnInwardRepository.save(
                yarnInward
        );
    }

    // ============================================================
    // DELETE
    // ============================================================

    public void deleteYarnInward(Long id) {

        YarnInward yarnInward =
                getYarnInwardById(id);

        yarnInwardRepository.delete(
                yarnInward
        );
    }

    // ============================================================
    // MAP DTO TO ENTITY
    // ============================================================

    private void mapDtoToEntity(
            YarnInwardDto dto,
            YarnInward entity) {

        // --------------------------------------------------------
        // INWARD DATE
        // --------------------------------------------------------

        if (dto.getInwardDate() != null) {

            entity.setInwardDate(
                    dto.getInwardDate()
            );

        } else if (entity.getYarnInwardId() == null) {

            entity.setInwardDate(
                    LocalDate.now()
            );
        }

        // --------------------------------------------------------
        // ORDER
        // --------------------------------------------------------

        if (dto.getOrderId() != null) {

            FabricOrder order =
                    fabricOrderRepository
                            .findById(
                                    dto.getOrderId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Fabric order not found with id: "
                                                    + dto.getOrderId()
                                    )
                            );

            entity.setOrder(order);

        } else if (
                entity.getYarnInwardId() == null) {

            entity.setOrder(null);
        }

        // --------------------------------------------------------
        // COUNT
        // --------------------------------------------------------

        if (dto.getCountId() != null) {

            YarnCount count =
                    yarnCountRepository
                            .findById(
                                    dto.getCountId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Yarn count not found with id: "
                                                    + dto.getCountId()
                                    )
                            );

            entity.setCount(count);

        } else if (
                entity.getYarnInwardId() == null) {

            entity.setCount(null);
        }

        // --------------------------------------------------------
        // TICKIT
        // --------------------------------------------------------

        if (dto.getTickitId() != null) {

            Tickits tickit =
                    tickitsRepository
                            .findById(
                                    dto.getTickitId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Tickit not found with id: "
                                                    + dto.getTickitId()
                                    )
                            );

            entity.setTickit(tickit);

        } else if (
                entity.getYarnInwardId() == null) {

            entity.setTickit(null);
        }

        // --------------------------------------------------------
        // SUPPLIER
        // --------------------------------------------------------

        if (dto.getSupplierId() != null) {

            Parties supplier =
                    partiesRepository
                            .findById(
                                    dto.getSupplierId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Supplier party not found with id: "
                                                    + dto.getSupplierId()
                                    )
                            );

            entity.setSupplier(supplier);

        } else if (
                entity.getYarnInwardId() == null) {

            entity.setSupplier(null);
        }

        // --------------------------------------------------------
        // STORAGE LOCATION
        // --------------------------------------------------------

        if (dto.getStorageLocationId() != null) {

            YarnStorageLocation storageLocation =
                    yarnStorageLocationRepository
                            .findById(
                                    dto.getStorageLocationId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Storage location not found with id: "
                                                    + dto.getStorageLocationId()
                                    )
                            );

            entity.setStorageLocation(
                    storageLocation
            );

        } else if (
                entity.getYarnInwardId() == null) {

            entity.setStorageLocation(null);
        }

        // --------------------------------------------------------
        // STORAGE SIZING
        // --------------------------------------------------------

        if (dto.getStorageSizingId() != null) {

            SizingUnit sizingUnit =
                    sizingUnitRepository
                            .findById(
                                    dto.getStorageSizingId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Storage sizing unit not found with id: "
                                                    + dto.getStorageSizingId()
                                    )
                            );

            entity.setStorageSizingUnit(
                    sizingUnit
            );

        } else if (
                entity.getYarnInwardId() == null) {

            entity.setStorageSizingUnit(null);
        }

        // --------------------------------------------------------
        // STORAGE PARTY
        // --------------------------------------------------------

        if (dto.getStoragePartyId() != null) {

            Parties storageParty =
                    partiesRepository
                            .findById(
                                    dto.getStoragePartyId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Storage party not found with id: "
                                                    + dto.getStoragePartyId()
                                    )
                            );

            entity.setStorageParty(
                    storageParty
            );

        } else if (
                entity.getYarnInwardId() == null) {

            entity.setStorageParty(null);
        }

        // ========================================================
        // BAGS + Y CONE
        // ========================================================

        if (entity.getYarnInwardId() == null) {

            // ----------------------------------------------------
            // NEW YARN INWARD
            // ----------------------------------------------------

            BigDecimal initialBags =
                    dto.getBags() != null
                            ? dto.getBags()
                            : BigDecimal.ZERO;

            BigDecimal initialCone =
                    dto.getYCone() != null
                            ? dto.getYCone()
                            : BigDecimal.ZERO;

            entity.setOriginalBags(
                    initialBags
            );

            entity.setBags(
                    initialBags
            );

            entity.setOriginalYCone(
                    initialCone
            );

            entity.setYCone(
                    initialCone
            );

            entity.setType("FRESH");

        } else {

            // ----------------------------------------------------
            // EXISTING YARN INWARD
            // ----------------------------------------------------

            if (dto.getOriginalBags() != null) {

                entity.setOriginalBags(
                        dto.getOriginalBags()
                );
            }

            if (dto.getBags() != null) {

                entity.setBags(
                        dto.getBags()
                );
            }

            if (dto.getOriginalYCone() != null) {

                entity.setOriginalYCone(
                        dto.getOriginalYCone()
                );
            }

            if (dto.getYCone() != null) {

                entity.setYCone(
                        dto.getYCone()
                );
            }

            if (dto.getType() != null
                    && !dto.getType().isBlank()) {

                entity.setType(
                        dto.getType().toUpperCase()
                );
            }

            if (entity.getType() == null
                    || entity.getType().isBlank()) {

                entity.setType("FRESH");
            }

            if (entity.getOriginalBags() == null
                    && entity.getBags() != null) {

                entity.setOriginalBags(
                        entity.getBags()
                );
            }

            if (entity.getOriginalYCone() == null
                    && entity.getYCone() != null) {

                entity.setOriginalYCone(
                        entity.getYCone()
                );
            }
        }

        // ========================================================
        // WEIGHT
        // ========================================================

        if (dto.getWeightKg() != null) {

            entity.setWeightKg(
                    dto.getWeightKg()
            );
        }

                if (dto.getWeightPerBag() != null) {
                        entity.setWeightPerBag(dto.getWeightPerBag());
                }

        // Store original weight for new records
        if (entity.getYarnInwardId() == null) {

            entity.setOriginalWeightKg(
                    dto.getWeightKg() != null
                            ? dto.getWeightKg()
                            : BigDecimal.ZERO
            );

                        // If client provided explicit weightPerBag use it, otherwise
                        // derive from weightKg / initialBags when possible.
                        if (dto.getWeightPerBag() != null) {
                                entity.setWeightPerBag(dto.getWeightPerBag());
                        } else if (dto.getWeightKg() != null && entity.getBags() != null && entity.getBags().compareTo(BigDecimal.ZERO) > 0) {
                                entity.setWeightPerBag(
                                                dto.getWeightKg()
                                                                .divide(entity.getBags(), 6, RoundingMode.HALF_UP)
                                                                .setScale(3, RoundingMode.HALF_UP)
                                );
                        }

        } else if (
                entity.getOriginalWeightKg() == null
                        && entity.getWeightKg() != null) {

            entity.setOriginalWeightKg(
                    entity.getWeightKg()
            );
        }

        // ========================================================
        // BILL / RATE
        // ========================================================

        entity.setBillNo(
                dto.getBillNo()
        );

        entity.setRate(
                dto.getRate()
        );

        entity.setGstPercent(
                dto.getGstPercent()
        );

        // ========================================================
        // CALCULATED AMOUNT
        // ========================================================

        if (dto.getCalculatedAmount() != null) {

            entity.setCalculatedAmount(
                    dto.getCalculatedAmount()
            );

        } else if (
                dto.getWeightKg() != null
                        && dto.getRate() != null) {

            BigDecimal baseAmount =
                    dto.getWeightKg()
                            .multiply(
                                    dto.getRate()
                            );

            if (dto.getGstPercent() != null
                    && dto.getGstPercent()
                    .compareTo(
                            BigDecimal.ZERO
                    ) > 0) {

                BigDecimal gstMultiplier =
                        BigDecimal.ONE.add(
                                dto.getGstPercent()
                                        .divide(
                                                BigDecimal.valueOf(100),
                                                4,
                                                RoundingMode.HALF_UP
                                        )
                        );

                entity.setCalculatedAmount(
                        baseAmount
                                .multiply(
                                        gstMultiplier
                                )
                                .setScale(
                                        2,
                                        RoundingMode.HALF_UP
                                )
                );

            } else {

                entity.setCalculatedAmount(
                        baseAmount.setScale(
                                2,
                                RoundingMode.HALF_UP
                        )
                );
            }
        }

        // ========================================================
        // PAYMENT / OTHER FIELDS
        // ========================================================

        entity.setActualAmount(
                dto.getActualAmount()
        );

        entity.setPaymentStatus(
                dto.getPaymentStatus() != null
                        ? dto.getPaymentStatus()
                        : "UNPAID"
        );

        entity.setPaidDate(
                dto.getPaidDate()
        );

        entity.setPaidAmount(
                dto.getPaidAmount() != null
                        ? dto.getPaidAmount()
                        : BigDecimal.ZERO
        );

        entity.setReceivedPayment(
                dto.getReceivedPayment() != null
                        ? dto.getReceivedPayment()
                        : BigDecimal.ZERO
        );

        entity.setBillAmount(
                dto.getBillAmount()
        );

        entity.setDays(
                dto.getDays()
        );

        entity.setReceivable(
                dto.getReceivable()
        );

        entity.setTcs(
                dto.getTcs()
        );

        entity.setAddAmount(
                dto.getAddAmount()
        );

        entity.setGst(
                dto.getGst()
        );

        entity.setTds(
                dto.getTds()
        );

        entity.setInterest(
                dto.getInterest()
        );

        entity.setRemark(
                dto.getRemark()
        );

        entity.setRemark2(
                dto.getRemark2()
        );
    }
}