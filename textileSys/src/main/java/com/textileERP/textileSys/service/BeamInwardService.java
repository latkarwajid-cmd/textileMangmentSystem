package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.*;
import com.textileERP.textileSys.model.*;
import com.textileERP.textileSys.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BeamInwardService {

    private static final Pattern INWARD_NO_PATTERN = Pattern.compile("BINW-(\\d+)", Pattern.CASE_INSENSITIVE);

    private final BeamInwardRepository beamInwardRepository;
    private final SizingSetRepository sizingSetRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final SizingUnitRepository sizingUnitRepository;
    private final YarnCountRepository yarnCountRepository;
    private final TickitsRepository tickitsRepository;
    private final PartiesRepository partiesRepository;
    private final SizingYarnInwardRepository sizingYarnInwardRepository;

    public BeamInwardService(BeamInwardRepository beamInwardRepository,
                             SizingSetRepository sizingSetRepository,
                             FabricOrderRepository fabricOrderRepository,
                             SizingUnitRepository sizingUnitRepository,
                             YarnCountRepository yarnCountRepository,
                             TickitsRepository tickitsRepository,
                             PartiesRepository partiesRepository,
                             SizingYarnInwardRepository sizingYarnInwardRepository) {
        this.beamInwardRepository = beamInwardRepository;
        this.sizingSetRepository = sizingSetRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.sizingUnitRepository = sizingUnitRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.tickitsRepository = tickitsRepository;
        this.partiesRepository = partiesRepository;
        this.sizingYarnInwardRepository = sizingYarnInwardRepository;
    }


    public List<BeamInward> getAll() {
        return beamInwardRepository.findAll();
    }

    public BeamInward getById(Long id) {
        return beamInwardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("BeamInward not found with id: " + id));
    }

    public List<BeamInward> getByOrder(Long orderId) {
        return beamInwardRepository.findByOrderOrderId(orderId);
    }

    public List<BeamInward> getBySizingSet(Long sizingSetId) {
        return beamInwardRepository.findBySizingSetSizingSetId(sizingSetId);
    }

    public List<BeamInward> getByInwardNo(String inwardNo) {
        return beamInwardRepository.findByInwardNo(inwardNo);
    }

    public String generateNextInwardNo() {
        List<BeamInward> list = beamInwardRepository.findAll();
        int maxNumber = 0; // Starts from 1: BINW-01, BINW-02...

        for (BeamInward b : list) {
            if (b.getInwardNo() == null || b.getInwardNo().isBlank()) {
                continue;
            }
            Matcher matcher = INWARD_NO_PATTERN.matcher(b.getInwardNo().trim());
            if (matcher.find()) {
                try {
                    int num = Integer.parseInt(matcher.group(1));
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        return String.format("BINW-%02d", maxNumber + 1);
    }


    @Transactional
    public List<BeamInward> createBatch(BeamInwardBatchDto request) {
        if (request == null) {
            throw new RuntimeException("Batch request cannot be null");
        }

        String inwardNo = request.getInwardNo();
        if (inwardNo == null || inwardNo.isBlank()) {
            inwardNo = generateNextInwardNo();
        }

        LocalDate inwardDate = request.getInwardDate() != null ? request.getInwardDate() : LocalDate.now();

        // Resolve shared references
        SizingSet sizingSet = null;
        if (request.getSizingSetId() != null) {
            sizingSet = sizingSetRepository.findById(request.getSizingSetId())
                    .orElseThrow(() -> new RuntimeException("Sizing set not found: " + request.getSizingSetId()));
        }

        FabricOrder order = null;
        if (request.getOrderId() != null) {
            order = fabricOrderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found: " + request.getOrderId()));
        } else if (sizingSet != null && sizingSet.getOrder() != null) {
            order = sizingSet.getOrder();
        }

        SizingUnit sizingUnit = null;
        if (request.getSizingId() != null) {
            sizingUnit = sizingUnitRepository.findById(request.getSizingId())
                    .orElseThrow(() -> new RuntimeException("Sizing unit not found: " + request.getSizingId()));
        } else if (sizingSet != null && sizingSet.getSizingUnit() != null) {
            sizingUnit = sizingSet.getSizingUnit();
        }

        Parties party = null;
        if (request.getPartyId() != null) {
            party = partiesRepository.findById(request.getPartyId())
                    .orElseThrow(() -> new RuntimeException("Party not found: " + request.getPartyId()));
        } else if (sizingSet != null && sizingSet.getParty() != null) {
            party = sizingSet.getParty();
        } else if (order != null && order.getParty() != null) {
            party = order.getParty();
        }

        YarnCount count = null;
        if (request.getCountId() != null) {
            count = yarnCountRepository.findById(request.getCountId())
                    .orElseThrow(() -> new RuntimeException("Yarn count not found: " + request.getCountId()));
        } else if (sizingSet != null && sizingSet.getCount() != null) {
            count = sizingSet.getCount();
        }

        Tickits tickit = null;
        if (request.getTickitId() != null) {
            tickit = tickitsRepository.findById(request.getTickitId())
                    .orElseThrow(() -> new RuntimeException("Tickit not found: " + request.getTickitId()));
        } else if (sizingSet != null && sizingSet.getTickit() != null) {
            tickit = sizingSet.getTickit();
        }

        String quality = request.getQuality();
        if ((quality == null || quality.isBlank()) && sizingSet != null) {
            quality = sizingSet.getQuality();
        }
        if ((quality == null || quality.isBlank()) && order != null) {
            quality = order.getQuality();
        }

        Integer totalEnds = request.getTotalEnds();
        if (totalEnds == null && sizingSet != null) {
            totalEnds = sizingSet.getTotalEnds();
        }

        List<BeamLineItemDto> beamLines = request.getBeamLines();
        if (beamLines == null || beamLines.isEmpty()) {
            throw new RuntimeException("At least one beam record is required");
        }

        List<BeamInward> savedList = new ArrayList<>();
        int lineIdx = 1;

        for (BeamLineItemDto line : beamLines) {
            if (line == null) continue;

            // Strict Validation
            String flangeNo = line.getFlangeNo();
            if (flangeNo == null || flangeNo.trim().isEmpty()) {
                throw new RuntimeException("Flange No is required for beam row #" + lineIdx);
            }

            BigDecimal meter = line.getMeter();
            if (meter == null || meter.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Meters must be strictly greater than 0 for beam row #" + lineIdx);
            }

            BigDecimal cuts = line.getCuts();
            if (cuts == null || cuts.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException("Cuts must be strictly greater than 0 for beam row #" + lineIdx);
            }

            BigDecimal grossWeight = line.getGrossWeight();
            BigDecimal tareWeight = line.getTareWeight();
            BigDecimal netWeight = line.getNetWeight();

            if (grossWeight != null && tareWeight != null) {
                netWeight = grossWeight.subtract(tareWeight);
                if (netWeight.compareTo(BigDecimal.ZERO) < 0) {
                    netWeight = BigDecimal.ZERO;
                }
            } else if (netWeight == null) {
                netWeight = line.getWeightKg();
            }

            BeamInward b = new BeamInward();
            b.setInwardNo(inwardNo);
            b.setInwardDate(inwardDate);
            b.setChallanNo(request.getChallanNo());
            b.setChallanDate(request.getChallanDate());
            b.setSizingSet(sizingSet);
            b.setOrder(order);
            b.setSizingUnit(sizingUnit);
            b.setParty(party);
            b.setShed(request.getShed());
            b.setQuality(quality);
            b.setCount(count);
            b.setTickit(tickit);
            b.setTotalEnds(totalEnds);
            b.setTotalBeamsCount(request.getTotalBeamsCount() != null ? request.getTotalBeamsCount() : beamLines.size());

            b.setBeamNo(line.getBeamNo() != null && !line.getBeamNo().isBlank() ? line.getBeamNo().trim() : String.valueOf(lineIdx));
            b.setFlangeNo(flangeNo.trim());
            b.setCuts(cuts);
            b.setMeter(meter);
            b.setGrossWeight(grossWeight);
            b.setTareWeight(tareWeight);
            b.setNetWeight(netWeight);
            b.setWeightKg(netWeight);
            b.setStatus(line.getStatus() != null && !line.getStatus().isBlank() ? line.getStatus() : "In Stock");
            b.setRemark(line.getRemark() != null && !line.getRemark().isBlank() ? line.getRemark() : request.getRemark());

            savedList.add(beamInwardRepository.save(b));
            lineIdx++;
        }

        return savedList;
    }

    @Transactional
    public List<BeamInward> completeInward(BeamInwardCompleteDto request) {
        if (request == null) {
            throw new RuntimeException("Complete inward request cannot be null");
        }

        // 1. Process and save all physical beams
        BeamInwardBatchDto batchDto = new BeamInwardBatchDto();
        batchDto.setInwardNo(request.getInwardNo());
        batchDto.setInwardDate(request.getInwardDate());
        batchDto.setChallanNo(request.getChallanNo());
        batchDto.setChallanDate(request.getChallanDate());
        batchDto.setSizingSetId(request.getSizingSetId());
        batchDto.setOrderId(request.getOrderId());
        batchDto.setSizingId(request.getSizingId());
        batchDto.setPartyId(request.getPartyId());
        batchDto.setShed(request.getShed());
        batchDto.setQuality(request.getQuality());
        batchDto.setCountId(request.getCountId());
        batchDto.setTickitId(request.getTickitId());
        batchDto.setTotalEnds(request.getTotalEnds());
        batchDto.setTotalBeamsCount(request.getTotalBeamsCount());
        batchDto.setRemark(request.getRemark());
        batchDto.setBeamLines(request.getBeamLines());

        List<BeamInward> savedBeams = createBatch(batchDto);

        // 2. Process Yarn Reconciliation & Balance Return (Pink Slip)
        if (request.getReconciliation() != null && request.getSizingSetId() != null) {
            YarnReconciliationDto rec = request.getReconciliation();
            SizingSet set = sizingSetRepository.findById(request.getSizingSetId()).orElse(null);

            if (set != null) {
                // Update SizingSet consumption and balance figures
                if (rec.getNetYarnConsumedKg() != null) {
                    set.setSizingConsumption(rec.getNetYarnConsumedKg());
                }
                if (rec.getTotalReturnedWeightKg() != null) {
                    set.setBalanceInSizing(rec.getTotalReturnedWeightKg());
                    set.setSizingFreshYarnReceived(rec.getTotalReturnedWeightKg());
                }
                sizingSetRepository.save(set);

                // Save individual returned yarn batches into sizing_yarn_inward for inventory tracking
                if (rec.getReturnsList() != null && !rec.getReturnsList().isEmpty()) {
                    LocalDate returnDate = request.getInwardDate() != null ? request.getInwardDate() : LocalDate.now();

                    for (BalanceReturnItemDto item : rec.getReturnsList()) {
                        if (item == null) continue;
                        boolean hasWeight = item.getReturnedWeightKg() != null && item.getReturnedWeightKg().compareTo(BigDecimal.ZERO) > 0;
                        boolean hasBags = item.getBagsReturned() != null && item.getBagsReturned().compareTo(BigDecimal.ZERO) > 0;

                        if (hasWeight || hasBags) {
                            SizingYarnInward ret = new SizingYarnInward();
                            ret.setSizingSet(set);
                            ret.setOrder(set.getOrder());
                            ret.setSizingUnit(set.getSizingUnit());
                            ret.setParty(set.getParty());
                            ret.setInwardDate(returnDate);

                            if (item.getCountId() != null) {
                                yarnCountRepository.findById(item.getCountId()).ifPresent(ret::setCount);
                            } else if (set.getCount() != null) {
                                ret.setCount(set.getCount());
                            }

                            if (item.getTickitId() != null) {
                                tickitsRepository.findById(item.getTickitId()).ifPresent(ret::setTickit);
                            } else if (set.getTickit() != null) {
                                ret.setTickit(set.getTickit());
                            }

                            ret.setBags(item.getBagsReturned());
                            ret.setWeightKg(item.getReturnedWeightKg());

                            String loc = item.getDestinationWarehouse() != null ? item.getDestinationWarehouse() : "Main Raw Yarn Warehouse";
                            String type = item.getItemType() != null ? item.getItemType() : "Returned Balance";
                            String customRemark = item.getRemark() != null ? item.getRemark() : "";
                            ret.setRemark(String.format("[%s - %s] %s (Challan: %s)", type, loc, customRemark, request.getChallanNo() != null ? request.getChallanNo() : "-").trim());

                            sizingYarnInwardRepository.save(ret);
                        }
                    }
                }
            }
        }

        return savedBeams;
    }

    public BeamInward create(BeamInwardDto request) {

        BeamInward b = new BeamInward();

        if (request.getSizingSetId() != null) {
            SizingSet set = sizingSetRepository.findById(request.getSizingSetId())
                    .orElseThrow(() -> new RuntimeException("Sizing set not found: " + request.getSizingSetId()));
            b.setSizingSet(set);
        }

        if (request.getOrderId() != null) {
            FabricOrder order = fabricOrderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found: " + request.getOrderId()));
            b.setOrder(order);
        }

        if (request.getSizingId() != null) {
            SizingUnit sizing = sizingUnitRepository.findById(request.getSizingId())
                    .orElseThrow(() -> new RuntimeException("Sizing unit not found: " + request.getSizingId()));
            b.setSizingUnit(sizing);
        }

        mapTransactionFields(request, b);

        return beamInwardRepository.save(b);
    }

    public BeamInward update(Long id, BeamInwardDto request) {
        BeamInward b = getById(id);

        if (request.getSizingSetId() != null) {
            SizingSet set = sizingSetRepository.findById(request.getSizingSetId())
                    .orElseThrow(() -> new RuntimeException("Sizing set not found: " + request.getSizingSetId()));
            b.setSizingSet(set);
        }

        if (request.getOrderId() != null) {
            FabricOrder order = fabricOrderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found: " + request.getOrderId()));
            b.setOrder(order);
        }

        if (request.getSizingId() != null) {
            SizingUnit sizing = sizingUnitRepository.findById(request.getSizingId())
                    .orElseThrow(() -> new RuntimeException("Sizing unit not found: " + request.getSizingId()));
            b.setSizingUnit(sizing);
        }

        mapTransactionFields(request, b);

        return beamInwardRepository.save(b);
    }

    private void mapTransactionFields(BeamInwardDto request, BeamInward entity) {
        if (request.getInwardNo() != null && !request.getInwardNo().isBlank()) {
            entity.setInwardNo(request.getInwardNo());
        } else if (entity.getInwardNo() == null) {
            entity.setInwardNo(generateNextInwardNo());
        }

        entity.setChallanNo(request.getChallanNo());
        entity.setChallanDate(request.getChallanDate());
        entity.setInwardDate(request.getInwardDate() != null ? request.getInwardDate() : LocalDate.now());
        entity.setShed(request.getShed());
        entity.setBeamNo(request.getBeamNo());
        entity.setFlangeNo(request.getFlangeNo());
        entity.setTotalEnds(request.getTotalEnds());
        entity.setTotalBeamsCount(request.getTotalBeamsCount());

        entity.setCuts(request.getCuts());
        entity.setMeter(request.getMeter());
        entity.setGrossWeight(request.getGrossWeight());
        entity.setTareWeight(request.getTareWeight());

        BigDecimal netWeight = request.getNetWeight();
        if (request.getGrossWeight() != null && request.getTareWeight() != null) {
            netWeight = request.getGrossWeight().subtract(request.getTareWeight());
        } else if (netWeight == null) {
            netWeight = request.getWeightKg();
        }
        entity.setNetWeight(netWeight);
        entity.setWeightKg(netWeight != null ? netWeight : request.getWeightKg());

        entity.setQuality(request.getQuality() != null && !request.getQuality().isBlank()
                ? request.getQuality()
                : (entity.getOrder() != null ? entity.getOrder().getQuality() : null));

        entity.setStatus(request.getStatus() == null || request.getStatus().isBlank() ? "In Stock" : request.getStatus());
        entity.setRemark(request.getRemark());

        if (request.getCountId() != null) {
            entity.setCount(yarnCountRepository.findById(request.getCountId())
                    .orElseThrow(() -> new RuntimeException("Yarn count not found: " + request.getCountId())));
        }
        if (request.getTickitId() != null) {
            entity.setTickit(tickitsRepository.findById(request.getTickitId())
                    .orElseThrow(() -> new RuntimeException("Tickit not found: " + request.getTickitId())));
        }
        if (request.getPartyId() != null) {
            entity.setParty(partiesRepository.findById(request.getPartyId())
                    .orElseThrow(() -> new RuntimeException("Party not found: " + request.getPartyId())));
        }
    }

    public void delete(Long id) {
        BeamInward b = getById(id);
        beamInwardRepository.delete(b);
    }
}

