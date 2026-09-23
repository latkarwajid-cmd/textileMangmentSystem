package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.SizingSetDto;
import com.textileERP.textileSys.dto.SizingSetYarnLineDto;
import com.textileERP.textileSys.model.FabricOrder;
import com.textileERP.textileSys.model.Parties;
import com.textileERP.textileSys.model.SizingSet;
import com.textileERP.textileSys.model.SizingSetYarnLine;
import com.textileERP.textileSys.model.SizingUnit;
import com.textileERP.textileSys.model.SizingYarnInward;
import com.textileERP.textileSys.model.Tickits;
import com.textileERP.textileSys.model.YarnCount;
import com.textileERP.textileSys.model.YarnInward;
import com.textileERP.textileSys.repository.FabricOrderRepository;
import com.textileERP.textileSys.repository.PartiesRepository;
import com.textileERP.textileSys.repository.SizingSetRepository;
import com.textileERP.textileSys.repository.SizingUnitRepository;
import com.textileERP.textileSys.repository.SizingYarnInwardRepository;
import com.textileERP.textileSys.repository.TickitsRepository;
import com.textileERP.textileSys.repository.YarnCountRepository;
import com.textileERP.textileSys.repository.YarnInwardRepository;

import jakarta.transaction.Transactional;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SizingSetService {

    private static final Set<String> SOURCES = Set.of(
            "Gate Pass",
            "Yarn In",
            "Warehouse",
            "Sizing",
            "Dyeing",
            "Other"
    );

    private static final Set<String> CONDITIONS = Set.of(
            "Fresh",
            "Winding",
            "Used"
    );

    private final SizingSetRepository sizingSetRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final PartiesRepository partiesRepository;
    private final SizingUnitRepository sizingUnitRepository;
    private final TickitsRepository tickitsRepository;
    private final YarnCountRepository yarnCountRepository;
    private final YarnInwardRepository yarnInwardRepository;
    private final SizingYarnInwardRepository sizingYarnInwardRepository;

    public SizingSetService(
            SizingSetRepository sizingSetRepository,
            FabricOrderRepository fabricOrderRepository,
            PartiesRepository partiesRepository,
            SizingUnitRepository sizingUnitRepository,
            TickitsRepository tickitsRepository,
            YarnCountRepository yarnCountRepository,
            YarnInwardRepository yarnInwardRepository,
            SizingYarnInwardRepository sizingYarnInwardRepository
    ) {
        this.sizingSetRepository = sizingSetRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.partiesRepository = partiesRepository;
        this.sizingUnitRepository = sizingUnitRepository;
        this.tickitsRepository = tickitsRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.yarnInwardRepository = yarnInwardRepository;
        this.sizingYarnInwardRepository = sizingYarnInwardRepository;
    }

    // ============================================================
    // GET ALL
    // ============================================================

    public List<SizingSet> getAllSizingSets() {
        return sizingSetRepository.findAll();
    }

    // ============================================================
    // GET BY ID
    // ============================================================

    public SizingSet getSizingSetById(Long id) {

        return sizingSetRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Sizing set not found with id: " + id
                        )
                );
    }

    // ============================================================
    // GENERATE NEXT SET NUMBER
    // ============================================================

    public String generateNextSetNo() {

        List<SizingSet> sets = sizingSetRepository.findAll();

        int maxNumber = 0;

        Pattern pattern =
                Pattern.compile("SET-(\\d+)", Pattern.CASE_INSENSITIVE);

        for (SizingSet set : sets) {

            // Skip soft-deleted records so they don't inflate the counter.
            if ("DELETED".equalsIgnoreCase(set.getStatus())) {
                continue;
            }

            if (set.getSetNo() == null) {
                continue;
            }

            Matcher matcher = pattern.matcher(set.getSetNo().trim());

            if (matcher.find()) {
                try {
                    int number = Integer.parseInt(matcher.group(1));

                    if (number > maxNumber) {
                        maxNumber = number;
                    }
                } catch (NumberFormatException ignored) {
                    // Ignore invalid set numbers.
                }
            }
        }

        // Pad to 2 digits: single-digit gets one leading zero (SET-01), 10+ have none.
        return String.format("SET-%02d", maxNumber + 1);
    }

    // ============================================================
    // CREATE
    // ============================================================

    @Transactional
    public SizingSet createSizingSet(
            SizingSetDto request
    ) {

        if (request == null) {
            throw new RuntimeException(
                    "Sizing set request cannot be null"
            );
        }

        String setNo =
                request.getSetNo() == null
                        ? null
                        : request.getSetNo().trim();

        validateSetNo(setNo);

        if (sizingSetRepository
                .existsBySetNoIgnoreCase(setNo)) {

            throw new RuntimeException(
                    "Sizing set already exists with set no: "
                            + setNo
            );
        }

        SizingSet sizingSet =
                new SizingSet();

        applyHeader(
                sizingSet,
                request
        );

        /*
         * IMPORTANT:
         * yarnLines is already initialized in the entity.
         *
         * replaceYarnLines() adds to that same collection.
         */
        replaceYarnLines(
                sizingSet,
                request.getYarnLines()
        );

        return sizingSetRepository.save(
                sizingSet
        );
    }

    // ============================================================
    // UPDATE
    // ============================================================

    @Transactional
    public SizingSet updateSizingSet(
            Long id,
            SizingSetDto request
    ) {

        if (request == null) {
            throw new RuntimeException(
                    "Sizing set request cannot be null"
            );
        }

        SizingSet existing =
                getSizingSetById(id);

        String setNo =
                request.getSetNo() == null
                        ? null
                        : request.getSetNo().trim();

        validateSetNo(setNo);

        Optional<SizingSet> duplicate =
                sizingSetRepository
                        .findBySetNoIgnoreCase(setNo);

        if (duplicate.isPresent()
                && !duplicate.get()
                .getSizingSetId()
                .equals(id)) {

            throw new RuntimeException(
                    "Sizing set already exists with set no: "
                            + setNo
            );
        }

        /*
         * ========================================================
         * STEP 1
         * Restore stock used by old allocations.
         * ========================================================
         */
        restoreAllocatedStock(existing);

        /*
         * ========================================================
         * STEP 2
         *
         * VERY IMPORTANT:
         *
         * DO NOT DO:
         *
         * existing.setYarnLines(new ArrayList<>());
         *
         * because orphanRemoval=true.
         *
         * Keep Hibernate's managed collection and clear it.
         * ========================================================
         */
        if (existing.getYarnLines() != null) {
            existing.getYarnLines().clear();
        }

        /*
         * ========================================================
         * STEP 3
         * Update header.
         * ========================================================
         */
        applyHeader(
                existing,
                request
        );

        /*
         * ========================================================
         * STEP 4
         * Add new lines to the SAME managed collection.
         * ========================================================
         */
        replaceYarnLines(
                existing,
                request.getYarnLines()
        );

        /*
         * Hibernate will save the entity and handle
         * orphanRemoval correctly.
         */
        return sizingSetRepository.save(
                existing
        );
    }

    // ============================================================
    // SOFT DELETE
    // ============================================================

    @Transactional
    public void softDeleteSizingSet(Long id) {

        SizingSet existing =
                getSizingSetById(id);

        /*
         * Return previously allocated stock.
         */
        restoreAllocatedStock(existing);

        /*
         * Keep Hibernate's managed collection.
         */
        if (existing.getYarnLines() != null) {
            existing.getYarnLines().clear();
        }

        existing.setStatus("DELETED");

        sizingSetRepository.save(
                existing
        );
    }

    // ============================================================
    // APPLY HEADER
    // ============================================================

    private void applyHeader(
            SizingSet sizingSet,
            SizingSetDto request
    ) {

        sizingSet.setSetNo(
                request.getSetNo() == null
                        ? null
                        : request.getSetNo().trim()
        );

        /*
         * Set date
         */
        if (request.getSetDate() != null) {
            sizingSet.setSetDate(
                    request.getSetDate()
            );
        } else if (sizingSet.getSetDate() == null) {
            sizingSet.setSetDate(
                    LocalDate.now()
            );
        }

        sizingSet.setPartNo(
                request.getPartNo()
        );

        sizingSet.setLasa(
                request.getLasa()
        );

        /*
         * ========================================================
         * ORDER
         * ========================================================
         */

        FabricOrder order = null;

        if (request.getOrderId() != null) {

            order =
                    fabricOrderRepository
                            .findById(
                                    request.getOrderId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Fabric order not found with id: "
                                                    + request.getOrderId()
                                    )
                            );
        }

        sizingSet.setOrder(order);


        /*
         * ========================================================
         * PARTY
         * ========================================================
         */

        Parties party = null;

        if (request.getPartyId() != null) {

            party =
                    partiesRepository
                            .findById(
                                    request.getPartyId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Party not found with id: "
                                                    + request.getPartyId()
                                    )
                            );
        }

        /*
         * If party wasn't explicitly sent,
         * derive it from order.
         */
        if (party == null && order != null) {
            party = order.getParty();
        }

        sizingSet.setParty(party);


        /*
         * ========================================================
         * SIZING UNIT
         * ========================================================
         */

        if (request.getSizingId() != null) {

            SizingUnit sizingUnit =
                    sizingUnitRepository
                            .findById(
                                    request.getSizingId()
                            )
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Sizing unit not found with id: "
                                                    + request.getSizingId()
                                    )
                            );

            sizingSet.setSizingUnit(
                    sizingUnit
            );

        } else {

            sizingSet.setSizingUnit(
                    null
            );
        }


        /*
         * ========================================================
         * COUNT
         *
         * Header count/tickit are optional.
         *
         * This avoids failing the entire Sizing Set because
         * frontend sent an invalid/stale count ID.
         * ========================================================
         */

        if (request.getCountId() != null) {

            sizingSet.setCount(
                    findCount(
                            request.getCountId()
                    )
            );

        } else {

            sizingSet.setCount(
                    null
            );
        }


        /*
         * ========================================================
         * TICKIT
         * ========================================================
         */

        if (request.getTickitId() != null) {

            sizingSet.setTickit(
                    findTickit(
                            request.getTickitId()
                    )
            );

        } else {

            sizingSet.setTickit(
                    null
            );
        }


        /*
         * ========================================================
         * QUALITY
         * ========================================================
         */

        String quality =
                request.getQuality();

        if (quality == null
                && order != null) {

            quality =
                    order.getQuality();
        }

        sizingSet.setQuality(
                quality
        );


        /*
         * ========================================================
         * TOTAL ENDS
         * ========================================================
         */

        Integer totalEnds =
                request.getTotalEnds();

        if (totalEnds == null
                && quality != null) {

            totalEnds =
                    parseTotalEnds(
                            quality
                    );
        }

        sizingSet.setTotalEnds(
                totalEnds
        );


        /*
         * ========================================================
         * SIZING METERS
         * ========================================================
         */

        sizingSet.setSizingMeters(
                request.getSizingMeters()
        );


        /*
         * ========================================================
         * OUT DATE
         * ========================================================
         */

        sizingSet.setOutDate(
                request.getOutDate()
        );


        /*
         * ========================================================
         * FINANCIAL / QUANTITY FIELDS
         * ========================================================
         */

        sizingSet.setBags(
                request.getBags()
        );

        sizingSet.setCone(
                request.getCone()
        );

        sizingSet.setWeightKg(
                request.getWeightKg()
        );

        sizingSet.setRate(
                request.getRate()
        );

        sizingSet.setBillNo(
                request.getBillNo()
        );

        sizingSet.setAmount(
                request.getAmount()
        );

        sizingSet.setTotalEnd(
                request.getTotalEnd()
        );

        sizingSet.setSizingMtr(
                request.getSizingMtr()
        );

        sizingSet.setSizingReceivedKhart(
                request.getSizingReceivedKhart()
        );

        sizingSet.setSizingFreshYarnReceived(
                request.getSizingFreshYarnReceived()
        );

        sizingSet.setBalanceInSizing(
                request.getBalanceInSizing()
        );

        sizingSet.setSizingConsumption(
                request.getSizingConsumption()
        );

        sizingSet.setSizingCount(
                request.getSizingCount()
        );


        /*
         * ========================================================
         * STATUS
         * ========================================================
         */

        if (request.getStatus() != null
                && !request.getStatus().isBlank()) {

            sizingSet.setStatus(
                    request.getStatus()
            );

        } else if (sizingSet.getStatus() == null) {

            sizingSet.setStatus(
                    "OPEN"
            );
        }
    }

    // ============================================================
    // REPLACE YARN LINES
    // ============================================================

    private void replaceYarnLines(
            SizingSet sizingSet,
            List<SizingSetYarnLineDto> lineDtos
    ) {

        /*
         * Make sure collection exists.
         *
         * Normally it is already initialized in SizingSet.
         */
        if (sizingSet.getYarnLines() == null) {

            sizingSet.setYarnLines(
                    new ArrayList<>()
            );
        }

        /*
         * IMPORTANT:
         *
         * We clear the existing collection instead of replacing it.
         *
         * This is safe for Hibernate orphanRemoval.
         */
        sizingSet.getYarnLines().clear();

        if (lineDtos == null
                || lineDtos.isEmpty()) {

            return;
        }

        int index = 1;

        BigDecimal totalBags =
                BigDecimal.ZERO;

        BigDecimal totalWeight =
                BigDecimal.ZERO;

        BigDecimal totalCones =
                BigDecimal.ZERO;


        for (SizingSetYarnLineDto dto
                : lineDtos) {

            if (dto == null) {
                continue;
            }


            /*
             * ====================================================
             * CREATE NEW LINE
             * ====================================================
             */

            SizingSetYarnLine line =
                    new SizingSetYarnLine();

            /*
             * VERY IMPORTANT
             *
             * Set owning side.
             */
            line.setSizingSet(
                    sizingSet
            );


            /*
             * ====================================================
             * SR NO
             * ====================================================
             */

            line.setSrNo(
                    dto.getSrNo() != null
                            ? dto.getSrNo()
                            : index
            );


            /*
             * ====================================================
             * SOURCE
             * ====================================================
             */

            String source =
                    normalizeSource(
                            dto.getSourceFrom()
                    );

            line.setSourceFrom(
                    source
            );


            /*
             * ====================================================
             * FRESH / WINDING
             * ====================================================
             */

            line.setFreshWinding(
                    normalizeCondition(
                            dto.getFreshWinding()
                    )
            );


            /*
             * ====================================================
             * BAGS
             * ====================================================
             */

            BigDecimal bags =
                    requirePositive(
                            dto.getBags(),
                            "Bags",
                            index
                    );


            /*
             * ====================================================
             * CONES
             * ====================================================
             */

            BigDecimal cones =
                    requireNonNegative(
                            dto.getCones(),
                            "Cones",
                            index
                    );


            /*
             * ====================================================
             * WEIGHT
             * ====================================================
             */

            BigDecimal weight =
                    requireNonNegative(
                            dto.getWeightKg(),
                            "Weight",
                            index
                    );

            BigDecimal weightPerBag =
                    dto.getWeightPerBag() == null
                            ? null
                            : requireNonNegative(dto.getWeightPerBag(), "Weight per bag", index);


            line.setBags(
                    bags
            );

            line.setCones(
                    cones
            );

            // If client provided weightPerBag prefer weightPerBag * bags as authoritative
            if (weightPerBag != null) {
                line.setWeightPerBag(weightPerBag);
                BigDecimal computed = weightPerBag.multiply(bags).setScale(3, RoundingMode.HALF_UP);
                line.setWeightKg(computed);
                weight = computed;
            } else {
                line.setWeightKg(weight);
            }

            line.setRemark(
                    dto.getRemark()
            );


            /*
             * ====================================================
             * YARN INWARD
             * ====================================================
             */

            if (dto.getYarnInwardId() != null) {

                YarnInward inward =
                        yarnInwardRepository
                                .findById(
                                        dto.getYarnInwardId()
                                )
                                .orElseThrow(() ->
                                        new RuntimeException(
                                                "Yarn Inward not found with id: "
                                                        + dto.getYarnInwardId()
                                        )
                                );


                line.setYarnInward(
                        inward
                );


                /*
                 * Use Count from Yarn Inward if frontend
                 * didn't provide one.
                 */
                if (dto.getCountId() != null) {

                    line.setCount(
                            findCount(
                                    dto.getCountId()
                            )
                    );

                } else {

                    line.setCount(
                            inward.getCount()
                    );
                }


                /*
                 * Use Tickit from Yarn Inward if frontend
                 * didn't provide one.
                 */
                if (dto.getTickitId() != null) {

                    line.setTickit(
                            findTickit(
                                    dto.getTickitId()
                            )
                    );

                } else {

                    line.setTickit(
                            inward.getTickit()
                    );
                }


                /*
                 * Deduct newly allocated stock.
                 */
                deductYarnInwardStock(
                        inward,
                        bags,
                        cones,
                        weight,
                        index
                );
            }


            /*
             * ====================================================
             * SIZING INWARD
             * ====================================================
             */

            if (dto.getSizingInwardId() != null) {

                SizingYarnInward sizingInward =
                        sizingYarnInwardRepository
                                .findById(
                                        dto.getSizingInwardId()
                                )
                                .orElseThrow(() ->
                                        new RuntimeException(
                                                "Sizing Inward not found with id: "
                                                        + dto.getSizingInwardId()
                                        )
                                );


                line.setSizingInward(
                        sizingInward
                );


                /*
                 * Use Count from Sizing Inward.
                 */
                if (dto.getCountId() != null) {

                    line.setCount(
                            findCount(
                                    dto.getCountId()
                            )
                    );

                } else {

                    line.setCount(
                            sizingInward.getCount()
                    );
                }


                /*
                 * Use Tickit from Sizing Inward.
                 */
                if (dto.getTickitId() != null) {

                    line.setTickit(
                            findTickit(
                                    dto.getTickitId()
                            )
                    );

                } else {

                    line.setTickit(
                            sizingInward.getTickit()
                    );
                }


                /*
                 * Deduct newly allocated sizing stock.
                 */
                deductSizingInwardStock(
                        sizingInward,
                        bags,
                        index
                );
            }


            /*
             * ====================================================
             * VALIDATE SOURCE
             * ====================================================
             */

            if (line.getYarnInward() == null
                    && line.getSizingInward() == null) {

                throw new RuntimeException(
                        "Yarn Inward or Sizing Inward is required "
                                + "for line " + index
                );
            }


            /*
             * A single line cannot use both.
             */
            if (line.getYarnInward() != null
                    && line.getSizingInward() != null) {

                throw new RuntimeException(
                        "A yarn line cannot use both "
                                + "Yarn Inward and Sizing Inward. "
                                + "Line: " + index
                );
            }


            /*
             * ====================================================
             * ADD TO HIBERNATE MANAGED COLLECTION
             * ====================================================
             */

            sizingSet.getYarnLines().add(
                    line
            );


            /*
             * ====================================================
             * TOTALS
             * ====================================================
             */

            totalBags =
                    totalBags.add(
                            bags
                    );

            totalCones =
                    totalCones.add(
                            cones
                    );

            totalWeight =
                    totalWeight.add(
                            weight
                    );


            index++;
        }


        /*
         * ========================================================
         * AUTO UPDATE HEADER TOTALS
         * ========================================================
         */

        sizingSet.setBags(
                totalBags
        );

        sizingSet.setCone(
                totalCones
        );

        sizingSet.setWeightKg(
                totalWeight
        );
    }

    // ============================================================
    // RESTORE OLD ALLOCATED STOCK
    // ============================================================

    private void restoreAllocatedStock(
            SizingSet sizingSet
    ) {

        if (sizingSet.getYarnLines() == null) {
            return;
        }


        for (
                SizingSetYarnLine line
                : sizingSet.getYarnLines()
        ) {

            if (line == null) {
                continue;
            }


            BigDecimal bags =
                    line.getBags();


            if (bags == null
                    || bags.compareTo(
                    BigDecimal.ZERO
            ) <= 0) {

                continue;
            }


            /*
             * ====================================================
             * RESTORE YARN INWARD
             * ====================================================
             */

            if (line.getYarnInward() != null) {

                YarnInward inward =
                        line.getYarnInward();

                BigDecimal currentBags =
                        inward.getBags() == null
                                ? BigDecimal.ZERO
                                : inward.getBags();

                BigDecimal currentCone =
                        inward.getYCone() == null
                                ? BigDecimal.ZERO
                                : inward.getYCone();

                BigDecimal currentWeight =
                        inward.getWeightKg() == null
                                ? BigDecimal.ZERO
                                : inward.getWeightKg();

                BigDecimal lineCones =
                        line.getCones() == null
                                ? BigDecimal.ZERO
                                : line.getCones();

                BigDecimal lineWeight =
                        line.getWeightKg() == null
                                ? BigDecimal.ZERO
                                : line.getWeightKg();

                inward.setBags(
                        currentBags.add(bags)
                );

                inward.setYCone(
                        currentCone.add(lineCones)
                                .setScale(3, RoundingMode.HALF_UP)
                );

                inward.setWeightKg(
                        currentWeight.add(lineWeight)
                                .setScale(3, RoundingMode.HALF_UP)
                );

                /*
                 * If all allocated bags and cones have been restored,
                 * make the Yarn Inward FRESH again and restore the
                 * original stock values.
                 */
                boolean bagsFullyRestored =
                        inward.getOriginalBags() != null
                                && inward.getBags() != null
                                && inward.getBags().compareTo(
                                inward.getOriginalBags()
                        ) >= 0;

                boolean conesFullyRestored =
                        inward.getOriginalYCone() != null
                                && inward.getYCone() != null
                                && inward.getYCone().compareTo(
                                inward.getOriginalYCone()
                        ) >= 0;

                if (bagsFullyRestored && conesFullyRestored) {

                    inward.setBags(
                            inward.getOriginalBags()
                    );

                    inward.setYCone(
                            inward.getOriginalYCone()
                    );

                    if (inward.getOriginalWeightKg() != null) {
                        inward.setWeightKg(
                                inward.getOriginalWeightKg()
                        );
                    }

                    inward.setType("FRESH");

                } else {

                    inward.setType("USED");
                }

                yarnInwardRepository.save(inward);
            }

            /*
             * ====================================================
             * RESTORE SIZING INWARD
             * ====================================================
             */

            if (line.getSizingInward() != null) {

                SizingYarnInward inward =
                        line.getSizingInward();

                BigDecimal current =
                        inward.getBags() == null
                                ? BigDecimal.ZERO
                                : inward.getBags();

                inward.setBags(
                        current.add(
                                bags
                        )
                );

                sizingYarnInwardRepository.save(
                        inward
                );
            }
        }
    }

    // ============================================================
    // DEDUCT YARN INWARD STOCK
    // ============================================================

    private void deductYarnInwardStock(
            YarnInward inward,
            BigDecimal bags,
            BigDecimal cones,
            BigDecimal issuedWeight,
            int lineNo
    ) {

        BigDecimal availableBags =
                inward.getBags() == null
                        ? BigDecimal.ZERO
                        : inward.getBags();

        BigDecimal availableCone =
                inward.getYCone() == null
                        ? BigDecimal.ZERO
                        : inward.getYCone();

        BigDecimal issuedCones =
                cones == null
                        ? BigDecimal.ZERO
                        : cones;

        BigDecimal weight =
                issuedWeight == null
                        ? BigDecimal.ZERO
                        : issuedWeight;

        if (bags.compareTo(availableBags) > 0) {
            throw new RuntimeException(
                    "Insufficient Yarn In stock for line "
                            + lineNo
                            + ". Available bags: "
                            + availableBags
                            + ", Requested: "
                            + bags
            );
        }

        if (issuedCones.compareTo(availableCone) > 0) {
            throw new RuntimeException(
                    "Insufficient Yarn In cone stock for line "
                            + lineNo
                            + ". Available cones: "
                            + availableCone
                            + ", Requested: "
                            + issuedCones
            );
        }

        /*
         * Store original values once.
         */
        if (inward.getOriginalBags() == null) {
            inward.setOriginalBags(availableBags);
        }

        if (inward.getOriginalYCone() == null) {
            inward.setOriginalYCone(availableCone);
        }

        if (inward.getOriginalWeightKg() == null) {
            inward.setOriginalWeightKg(
                    inward.getWeightKg() == null
                            ? BigDecimal.ZERO
                            : inward.getWeightKg()
            );
        }

        BigDecimal remainingBags =
                availableBags.subtract(bags);

        BigDecimal remainingCone =
                availableCone.subtract(issuedCones);

        BigDecimal currentWeight =
                inward.getWeightKg() == null
                        ? BigDecimal.ZERO
                        : inward.getWeightKg();

        BigDecimal remainingWeight =
                currentWeight.subtract(weight);

        if (remainingWeight.compareTo(BigDecimal.ZERO) < 0) {
            remainingWeight = BigDecimal.ZERO;
        }

        inward.setBags(
                remainingBags.setScale(3, RoundingMode.HALF_UP)
        );

        inward.setYCone(
                remainingCone.setScale(3, RoundingMode.HALF_UP)
        );

        inward.setWeightKg(
                remainingWeight.setScale(3, RoundingMode.HALF_UP)
        );

        /*
         * Any issued quantity means USED.
         */
        if (bags.compareTo(BigDecimal.ZERO) > 0
                || issuedCones.compareTo(BigDecimal.ZERO) > 0) {
            inward.setType("USED");
        }

        yarnInwardRepository.save(inward);
    }

    // ============================================================
    // DEDUCT SIZING INWARD STOCK
    // ============================================================

    private void deductSizingInwardStock(
            SizingYarnInward inward,
            BigDecimal bags,
            int lineNo
    ) {

        BigDecimal available =
                inward.getBags() == null
                        ? BigDecimal.ZERO
                        : inward.getBags();


        if (bags.compareTo(
                available
        ) > 0) {

            throw new RuntimeException(
                    "Insufficient Sizing In stock for line "
                            + lineNo
                            + ". Available: "
                            + available
                            + ", Requested: "
                            + bags
            );
        }


        inward.setBags(
                available.subtract(
                        bags
                )
        );

        sizingYarnInwardRepository.save(
                inward
        );
    }

    // ============================================================
    // FIND COUNT
    // ============================================================

    private YarnCount findCount(
            Long id
    ) {

        if (id == null) {
            return null;
        }

        return yarnCountRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Yarn count not found with id: "
                                        + id
                        )
                );
    }

    // ============================================================
    // FIND TICKIT
    // ============================================================

    private Tickits findTickit(
            Long id
    ) {

        if (id == null) {
            return null;
        }

        return tickitsRepository
                .findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Tickit not found with id: "
                                        + id
                        )
                );
    }

    // ============================================================
    // VALIDATE SET NUMBER
    // ============================================================

    private void validateSetNo(
            String setNo
    ) {

        if (setNo == null
                || setNo.isBlank()) {

            throw new RuntimeException(
                    "Set number is required"
            );
        }
    }

    // ============================================================
    // NORMALIZE SOURCE
    // ============================================================

    private String normalizeSource(
            String source
    ) {

        if (source == null
                || source.isBlank()) {

            return "Yarn In";
        }

        String value =
                source.trim();


        for (String allowed
                : SOURCES) {

            if (allowed.equalsIgnoreCase(
                    value
            )) {

                return allowed;
            }
        }


        /*
         * Support frontend variations.
         */
        if (value.equalsIgnoreCase("YARN_IN")) {
            return "Yarn In";
        }

        if (value.equalsIgnoreCase("SIZING_IN")) {
            return "Sizing";
        }

        if (value.equalsIgnoreCase("GATE_PASS")) {
            return "Gate Pass";
        }

        if (value.equalsIgnoreCase("WAREHOUSE")) {
            return "Warehouse";
        }

        if (value.equalsIgnoreCase("DYEING")) {
            return "Dyeing";
        }

        if (value.equalsIgnoreCase("OTHER")) {
            return "Other";
        }


        throw new RuntimeException(
                "Invalid source: "
                        + source
                        + ". Allowed values: "
                        + SOURCES
        );
    }

    // ============================================================
    // NORMALIZE CONDITION
    // ============================================================

    private String normalizeCondition(
            String condition
    ) {

        if (condition == null
                || condition.isBlank()) {

            return "Fresh";
        }

        String value =
                condition.trim();


        for (String allowed
                : CONDITIONS) {

            if (allowed.equalsIgnoreCase(
                    value
            )) {

                return allowed;
            }
        }


        throw new RuntimeException(
                "Invalid Fresh/Used/Winding value: "
                        + condition
        );
    }

    // ============================================================
    // REQUIRE NON NEGATIVE
    // ============================================================

    private BigDecimal requireNonNegative(
            BigDecimal value,
            String field,
            int lineNo
    ) {

        if (value == null) {
            return BigDecimal.ZERO;
        }

        if (value.compareTo(
                BigDecimal.ZERO
        ) < 0) {

            throw new RuntimeException(
                    field
                            + " cannot be negative "
                            + "for line "
                            + lineNo
            );
        }

        return value;
    }

    // ============================================================
    // REQUIRE POSITIVE
    // ============================================================

    private BigDecimal requirePositive(
            BigDecimal value,
            String field,
            int lineNo
    ) {

        if (value == null) {

            throw new RuntimeException(
                    field
                            + " is required for line "
                            + lineNo
            );
        }

        if (value.compareTo(
                BigDecimal.ZERO
        ) <= 0) {

            throw new RuntimeException(
                    field
                            + " must be greater than zero "
                            + "for line "
                            + lineNo
            );
        }

        return value;
    }

    // ============================================================
    // PARSE TOTAL ENDS
    // ============================================================

    private Integer parseTotalEnds(
            String quality
    ) {

        if (quality == null
                || quality.isBlank()) {

            return null;
        }


        /*
         * First try explicit "ends".
         *
         * Example:
         * 3400 Ends
         */
        Pattern endsPattern =
                Pattern.compile(
                        "(\\d+)\\s*ends",
                        Pattern.CASE_INSENSITIVE
                );

        Matcher endsMatcher =
                endsPattern.matcher(
                        quality
                );


        if (endsMatcher.find()) {

            try {

                return Integer.parseInt(
                        endsMatcher.group(1)
                );

            } catch (NumberFormatException ignored) {
                // Continue below
            }
        }


        /*
         * Fallback:
         * find a reasonably large number.
         */
        Pattern numberPattern =
                Pattern.compile(
                        "\\b(\\d{4,})\\b"
                );

        Matcher numberMatcher =
                numberPattern.matcher(
                        quality
                );


        if (numberMatcher.find()) {

            try {

                return Integer.parseInt(
                        numberMatcher.group(1)
                );

            } catch (NumberFormatException ignored) {
                // Return null below
            }
        }


        return null;
    }
}

