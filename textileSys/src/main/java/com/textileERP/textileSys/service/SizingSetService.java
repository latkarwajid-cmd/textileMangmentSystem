package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.SizingSetDto;
import com.textileERP.textileSys.dto.SizingSetYarnLineDto;
import com.textileERP.textileSys.model.FabricOrder;
import com.textileERP.textileSys.model.Parties;
import com.textileERP.textileSys.model.SizingSet;
import com.textileERP.textileSys.model.SizingSetYarnLine;
import com.textileERP.textileSys.model.SizingUnit;
import com.textileERP.textileSys.model.Tickits;
import com.textileERP.textileSys.model.YarnCount;
import com.textileERP.textileSys.model.YarnInward;
import com.textileERP.textileSys.repository.FabricOrderRepository;
import com.textileERP.textileSys.repository.PartiesRepository;
import com.textileERP.textileSys.repository.SizingSetRepository;
import com.textileERP.textileSys.repository.SizingUnitRepository;
import com.textileERP.textileSys.repository.TickitsRepository;
import com.textileERP.textileSys.repository.YarnCountRepository;
import com.textileERP.textileSys.repository.YarnInwardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SizingSetService {

    private static final Pattern SET_NUMBER = Pattern.compile("(\\d+)$");
    private static final Set<String> SOURCES = Set.of("Gate Pass", "Warehouse", "Sizing", "Dyeing", "Other");
    private static final Set<String> CONDITIONS = Set.of("Fresh", "Winding");

    private final SizingSetRepository sizingSetRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final PartiesRepository partiesRepository;
    private final SizingUnitRepository sizingUnitRepository;
    private final TickitsRepository tickitsRepository;
    private final YarnCountRepository yarnCountRepository;
    private final YarnInwardRepository yarnInwardRepository;

    public SizingSetService(
            SizingSetRepository sizingSetRepository,
            FabricOrderRepository fabricOrderRepository,
            PartiesRepository partiesRepository,
            SizingUnitRepository sizingUnitRepository,
            TickitsRepository tickitsRepository,
            YarnCountRepository yarnCountRepository,
            YarnInwardRepository yarnInwardRepository) {

        this.sizingSetRepository = sizingSetRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.partiesRepository = partiesRepository;
        this.sizingUnitRepository = sizingUnitRepository;
        this.tickitsRepository = tickitsRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.yarnInwardRepository = yarnInwardRepository;
    }

    public List<SizingSet> getAllSizingSets() {
        return sizingSetRepository.findAll();
    }

    public SizingSet getSizingSetById(Long id) {
        return sizingSetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sizing set not found: " + id));
    }

    public String generateNextSetNo() {
        int maxNumber = 0;
        for (SizingSet existing : sizingSetRepository.findAll()) {
            if (existing.getSetNo() == null) {
                continue;
            }
            Matcher matcher = SET_NUMBER.matcher(existing.getSetNo().trim());
            if (matcher.find()) {
                maxNumber = Math.max(maxNumber, Integer.parseInt(matcher.group(1)));
            }
        }
        return String.format("SET-%04d", maxNumber + 1);
    }

    @Transactional
    public SizingSet createSizingSet(SizingSetDto request) {
        String setNo = request.getSetNo() == null || request.getSetNo().isBlank()
                ? generateNextSetNo()
                : request.getSetNo().trim();

        if (sizingSetRepository.existsBySetNoIgnoreCase(setNo)) {
            throw new RuntimeException("Sizing set already exists with number: " + setNo);
        }

        SizingSet sizingSet = new SizingSet();
        sizingSet.setSetNo(setNo);
        applyHeader(sizingSet, request);
        replaceYarnLines(sizingSet, request.getYarnLines());
        return sizingSetRepository.save(sizingSet);
    }

    @Transactional
    public SizingSet updateSizingSet(Long id, SizingSetDto request) {
        SizingSet existing = getSizingSetById(id);

        if (request.getSetNo() != null && !request.getSetNo().isBlank()) {
            String setNo = request.getSetNo().trim();
            if (!existing.getSetNo().equalsIgnoreCase(setNo)
                    && sizingSetRepository.existsBySetNoIgnoreCase(setNo)) {
                throw new RuntimeException("Sizing set already exists with number: " + setNo);
            }
            existing.setSetNo(setNo);
        }

        applyHeader(existing, request);
        replaceYarnLines(existing, request.getYarnLines());
        return sizingSetRepository.save(existing);
    }

    @Transactional
    public void softDeleteSizingSet(Long id) {
        SizingSet existing = getSizingSetById(id);
        existing.setStatus("DELETED");
        sizingSetRepository.save(existing);
    }

    private void applyHeader(SizingSet sizingSet, SizingSetDto request) {
        LocalDate setDate = request.getSetDate() != null ? request.getSetDate() : LocalDate.now();
        sizingSet.setSetDate(setDate);
        sizingSet.setOutDate(request.getOutDate() != null ? request.getOutDate() : setDate);
        sizingSet.setPartNo(blankToNull(request.getPartNo()));
        sizingSet.setLasa(blankToNull(request.getLasa()));

        sizingSet.setOrder(findOrder(request.getOrderId()));
        sizingSet.setCount(findCount(request.getCountId()));
        sizingSet.setTickit(findTickit(request.getTickitId()));
        sizingSet.setSizingUnit(findSizingUnit(request.getSizingId()));

        Parties party = findParty(request.getPartyId());
        if (party == null && sizingSet.getOrder() != null) {
            party = sizingSet.getOrder().getParty();
        }
        sizingSet.setParty(party);

        String quality = request.getQuality();
        if ((quality == null || quality.isBlank()) && sizingSet.getOrder() != null) {
            quality = sizingSet.getOrder().getQuality();
        }
        sizingSet.setQuality(quality);

        Integer totalEnds = request.getTotalEnds();
        if (totalEnds == null && quality != null) {
            totalEnds = parseTotalEnds(quality);
        }
        sizingSet.setTotalEnds(totalEnds);

        sizingSet.setSizingMeters(request.getSizingMeters());
        sizingSet.setBags(request.getBags());
        sizingSet.setCone(request.getCone());
        sizingSet.setWeightKg(request.getWeightKg());
        sizingSet.setRate(request.getRate());
        sizingSet.setBillNo(request.getBillNo());
        sizingSet.setAmount(request.getAmount());
        sizingSet.setTotalEnd(request.getTotalEnd());
        sizingSet.setSizingMtr(request.getSizingMtr());
        sizingSet.setSizingReceivedKhart(request.getSizingReceivedKhart());
        sizingSet.setSizingFreshYarnReceived(request.getSizingFreshYarnReceived());
        sizingSet.setBalanceInSizing(request.getBalanceInSizing());
        sizingSet.setSizingConsumption(request.getSizingConsumption());
        sizingSet.setSizingCount(request.getSizingCount());
        sizingSet.setStatus(
                request.getStatus() == null || request.getStatus().isBlank()
                        ? "OPEN"
                        : request.getStatus()
        );
    }

    private void replaceYarnLines(SizingSet sizingSet, List<SizingSetYarnLineDto> lineDtos) {
        if (sizingSet.getYarnLines() == null) {
            sizingSet.setYarnLines(new java.util.ArrayList<>());
        }
        sizingSet.getYarnLines().clear();

        if (lineDtos == null) {
            return;
        }

        int index = 1;
        BigDecimal calculatedTotalBags = BigDecimal.ZERO;
        BigDecimal calculatedTotalWeight = BigDecimal.ZERO;
        BigDecimal calculatedTotalCones = BigDecimal.ZERO;

        for (SizingSetYarnLineDto dto : lineDtos) {
            SizingSetYarnLine line = new SizingSetYarnLine();
            line.setSizingSet(sizingSet);
            line.setSrNo(dto.getSrNo() != null ? dto.getSrNo() : index);

            String source = normalizeSource(dto.getSourceFrom());
            line.setSourceFrom(source);
            line.setFreshWinding(normalizeCondition(dto.getFreshWinding()));

            YarnInward inward = findYarnInward(dto.getYarnInwardId());
            line.setYarnInward(inward);

            // Rule A: When Gate Pass is selected, lock in exact count and tickit from inward challan
            if ("Gate Pass".equalsIgnoreCase(source) && inward != null) {
                line.setCount(dto.getCountId() != null ? findCount(dto.getCountId()) : inward.getCount());
                line.setTickit(dto.getTickitId() != null ? findTickit(dto.getTickitId()) : inward.getTickit());
            } else {
                line.setCount(findCount(dto.getCountId()));
                line.setTickit(findTickit(dto.getTickitId()));
            }

            BigDecimal bags = requireNonNegative(dto.getBags(), "Bags");
            BigDecimal cones = requireNonNegative(dto.getCones(), "Cones");
            BigDecimal weight = requireNonNegative(dto.getWeightKg(), "Weight");

            line.setBags(bags);
            line.setCones(cones);
            line.setWeightKg(weight);
            line.setRemark(blankToNull(dto.getRemark()));

            if (bags != null) calculatedTotalBags = calculatedTotalBags.add(bags);
            if (cones != null) calculatedTotalCones = calculatedTotalCones.add(cones);
            if (weight != null) calculatedTotalWeight = calculatedTotalWeight.add(weight);

            sizingSet.getYarnLines().add(line);
            index++;
        }

        // Auto-populate header totals from yarn lines if not explicitly passed
        if (sizingSet.getBags() == null) {
            sizingSet.setBags(calculatedTotalBags);
        }
        if (sizingSet.getWeightKg() == null) {
            sizingSet.setWeightKg(calculatedTotalWeight);
        }
        if (sizingSet.getCone() == null && calculatedTotalCones.compareTo(BigDecimal.ZERO) > 0) {
            sizingSet.setCone(calculatedTotalCones);
        }
    }

    private Integer parseTotalEnds(String quality) {
        if (quality == null || quality.isBlank()) {
            return null;
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(?i)ends?\\s*[:=-]?\\s*(\\d+)").matcher(quality);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        matcher = java.util.regex.Pattern.compile("\\b(\\d{4,})\\b").matcher(quality);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return null;
    }

    private String normalizeSource(String sourceFrom) {
        if (sourceFrom == null || sourceFrom.isBlank()) {
            return "Warehouse";
        }
        if (!SOURCES.contains(sourceFrom)) {
            throw new RuntimeException("Invalid From? value: " + sourceFrom);
        }
        return sourceFrom;
    }

    private String normalizeCondition(String freshWinding) {
        if (freshWinding == null || freshWinding.isBlank()) {
            return "Fresh";
        }
        if (!CONDITIONS.contains(freshWinding)) {
            throw new RuntimeException("Invalid Fresh / Winding value: " + freshWinding);
        }
        return freshWinding;
    }

    private BigDecimal requireNonNegative(BigDecimal value, String fieldName) {
        if (value != null && value.signum() < 0) {
            throw new RuntimeException(fieldName + " cannot be negative");
        }
        return value;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private FabricOrder findOrder(Long id) {
        return id == null
                ? null
                : fabricOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fabric order not found with id: " + id));
    }

    private YarnCount findCount(Long id) {
        return id == null
                ? null
                : yarnCountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn count not found with id: " + id));
    }

    private Tickits findTickit(Long id) {
        return id == null
                ? null
                : tickitsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tickit not found with id: " + id));
    }

    private SizingUnit findSizingUnit(Long id) {
        return id == null
                ? null
                : sizingUnitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sizing unit not found with id: " + id));
    }

    private Parties findParty(Long id) {
        return id == null
                ? null
                : partiesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Party not found with id: " + id));
    }

    private YarnInward findYarnInward(Long id) {
        return id == null
                ? null
                : yarnInwardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn inward / gate pass not found with id: " + id));
    }
}
