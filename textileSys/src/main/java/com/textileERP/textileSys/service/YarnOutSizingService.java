package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnOutSizingDto;
import com.textileERP.textileSys.model.*;
import com.textileERP.textileSys.repository.*;

import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class YarnOutSizingService {

    private final YarnOutSizingRepository yarnOutSizingRepository;
    private final SizingSetRepository sizingSetRepository;
    private final TickitsRepository tickitsRepository;
    private final FabricOrderRepository fabricOrderRepository;
    private final YarnCountRepository yarnCountRepository;
    private final PartiesRepository partiesRepository;

    public YarnOutSizingService(
            YarnOutSizingRepository yarnOutSizingRepository,
            SizingSetRepository sizingSetRepository,
            TickitsRepository tickitsRepository,
            FabricOrderRepository fabricOrderRepository,
            YarnCountRepository yarnCountRepository,
            PartiesRepository partiesRepository) {

        this.yarnOutSizingRepository = yarnOutSizingRepository;
        this.sizingSetRepository = sizingSetRepository;
        this.tickitsRepository = tickitsRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.partiesRepository = partiesRepository;
    }

    // Get all entries
    public List<YarnOutSizing> getAllYarnOutSizing() {
        return yarnOutSizingRepository.findAll();
    }

    // Get by ID
    public YarnOutSizing getYarnOutSizingById(Long id) {
        return yarnOutSizingRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Yarn out sizing entry not found with id: " + id));
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
    public YarnOutSizing updateYarnOutSizing(
            Long id,
            YarnOutSizingDto request) {

        YarnOutSizing yarnOutSizing = getYarnOutSizingById(id);

        mapDtoToEntity(request, yarnOutSizing);

        return yarnOutSizingRepository.save(yarnOutSizing);
    }

    // Delete entry
    public void deleteYarnOutSizing(Long id) {

        YarnOutSizing yarnOutSizing = getYarnOutSizingById(id);

        yarnOutSizingRepository.delete(yarnOutSizing);
    }

    private void mapDtoToEntity(
            YarnOutSizingDto dto,
            YarnOutSizing entity) {

        // -----------------------------
        // SIZING SET
        // -----------------------------

        if (dto.getSizingSetId() == null) {
            throw new RuntimeException("Sizing Set ID is required");
        }

        SizingSet sizingSet = sizingSetRepository
                .findById(dto.getSizingSetId())
                .orElseThrow(() ->
                        new RuntimeException(
                                "Sizing set not found with id: "
                                        + dto.getSizingSetId()));

        entity.setSizingSet(sizingSet);


        // -----------------------------
        // TICKIT
        // -----------------------------

        if (dto.getTickitId() != null) {

            Tickits tickit = tickitsRepository
                    .findById(dto.getTickitId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Tickit not found with id: "
                                            + dto.getTickitId()));

            entity.setTickit(tickit);

        } else {
            entity.setTickit(null);
        }


        // -----------------------------
        // ORDER
        // -----------------------------

        if (dto.getOrderId() != null) {

            FabricOrder order = fabricOrderRepository
                    .findById(dto.getOrderId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Order not found with id: "
                                            + dto.getOrderId()));

            entity.setOrder(order);

        } else {
            entity.setOrder(null);
        }


        // -----------------------------
        // YARN COUNT
        // -----------------------------

        if (dto.getCountId() != null) {

            YarnCount yarnCount = yarnCountRepository
                    .findById(dto.getCountId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Yarn count not found with id: "
                                            + dto.getCountId()));

            entity.setYarnCount(yarnCount);

        } else {
            entity.setYarnCount(null);
        }


        // -----------------------------
        // PARTY
        // -----------------------------

        if (dto.getPartyId() != null) {

            Parties party = partiesRepository
                    .findById(dto.getPartyId())
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Party not found with id: "
                                            + dto.getPartyId()));

            entity.setParty(party);

        } else {
            entity.setParty(null);
        }


        // -----------------------------
        // DATE
        // -----------------------------

        if (dto.getOutDate() != null) {

            entity.setOutDate(dto.getOutDate());

        } else if (entity.getOutDate() == null) {

            entity.setOutDate(LocalDate.now());
        }


        // -----------------------------
        // EXISTING FIELDS
        // -----------------------------

        entity.setBags(dto.getBags());

        entity.setCone(dto.getCone());

        entity.setWeightKg(dto.getWeightKg());

        entity.setRate(dto.getRate());

        entity.setBillNo(dto.getBillNo());


        // -----------------------------
        // AMOUNT
        // -----------------------------

        if (dto.getAmount() != null) {

            entity.setAmount(dto.getAmount());

        } else if (
                dto.getWeightKg() != null &&
                        dto.getRate() != null) {

            entity.setAmount(
                    dto.getWeightKg()
                            .multiply(dto.getRate())
                            .setScale(2, RoundingMode.HALF_UP)
            );
        }


        // -----------------------------
        // NEW SIZING FIELDS
        // -----------------------------

        entity.setTotalEnd(dto.getTotalEnd());

        entity.setSizingMtr(dto.getSizingMtr());

        entity.setSizingReceivedKhart(
                dto.getSizingReceivedKhart()
        );

        entity.setSizingFreshYarnReceived(
                dto.getSizingFreshYarnReceived()
        );

        entity.setBalanceInSizing(
                dto.getBalanceInSizing()
        );

        entity.setSizingConsumption(
                dto.getSizingConsumption()
        );

        entity.setSizingCount(
                dto.getSizingCount()
        );

        entity.setStatus(dto.getStatus());
    }
}