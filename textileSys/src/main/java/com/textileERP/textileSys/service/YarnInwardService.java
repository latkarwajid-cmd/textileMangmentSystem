package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnInwardDto;
import com.textileERP.textileSys.model.*;
import com.textileERP.textileSys.repository.*;
import org.springframework.stereotype.Service;

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

    public YarnInwardService(
            YarnInwardRepository yarnInwardRepository,
            FabricOrderRepository fabricOrderRepository,
            YarnCountRepository yarnCountRepository,
            TickitsRepository tickitsRepository,
            PartiesRepository partiesRepository) {
        this.yarnInwardRepository = yarnInwardRepository;
        this.fabricOrderRepository = fabricOrderRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.tickitsRepository = tickitsRepository;
        this.partiesRepository = partiesRepository;
    }

    // Get all yarn inwards
    public List<YarnInward> getAllYarnInwards() {
        return yarnInwardRepository.findAll();
    }

    // Get yarn inward by ID
    public YarnInward getYarnInwardById(Long id) {
        return yarnInwardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn inward entry not found with id: " + id));
    }

    // Get yarn inwards by supplier ID
    public List<YarnInward> getYarnInwardsBySupplierId(Long supplierId) {
        return yarnInwardRepository.findBySupplierPartyId(supplierId);
    }

    // Get yarn inwards by order ID
    public List<YarnInward> getYarnInwardsByOrderId(Long orderId) {
        return yarnInwardRepository.findByOrderOrderId(orderId);
    }

    // Get yarn inwards by payment status
    public List<YarnInward> getYarnInwardsByPaymentStatus(String paymentStatus) {
        return yarnInwardRepository.findByPaymentStatusIgnoreCase(paymentStatus);
    }

    // Create yarn inward
    public YarnInward createYarnInward(YarnInwardDto request) {
        YarnInward yarnInward = new YarnInward();
        mapDtoToEntity(request, yarnInward);
        return yarnInwardRepository.save(yarnInward);
    }

    // Update yarn inward
    public YarnInward updateYarnInward(Long id, YarnInwardDto request) {
        YarnInward yarnInward = getYarnInwardById(id);
        mapDtoToEntity(request, yarnInward);
        return yarnInwardRepository.save(yarnInward);
    }

    // Delete yarn inward
    public void deleteYarnInward(Long id) {
        YarnInward yarnInward = getYarnInwardById(id);
        yarnInwardRepository.delete(yarnInward);
    }

    private void mapDtoToEntity(YarnInwardDto dto, YarnInward entity) {
        if (dto.getInwardDate() != null) {
            entity.setInwardDate(dto.getInwardDate());
        } else if (entity.getInwardDate() == null) {
            entity.setInwardDate(LocalDate.now());
        }

        // Order mapping
        if (dto.getOrderId() != null) {
            FabricOrder order = fabricOrderRepository.findById(dto.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Fabric order not found with id: " + dto.getOrderId()));
            entity.setOrder(order);
        } else {
            entity.setOrder(null);
        }

        // Yarn count mapping
        if (dto.getCountId() != null) {
            YarnCount count = yarnCountRepository.findById(dto.getCountId())
                    .orElseThrow(() -> new RuntimeException("Yarn count not found with id: " + dto.getCountId()));
            entity.setCount(count);
        } else {
            entity.setCount(null);
        }

        // Tickit mapping
        if (dto.getTickitId() != null) {
            Tickits tickit = tickitsRepository.findById(dto.getTickitId())
                    .orElseThrow(() -> new RuntimeException("Tickit not found with id: " + dto.getTickitId()));
            entity.setTickit(tickit);
        } else {
            entity.setTickit(null);
        }

        // Supplier mapping
        if (dto.getSupplierId() != null) {
            Parties supplier = partiesRepository.findById(dto.getSupplierId())
                    .orElseThrow(() -> new RuntimeException("Supplier party not found with id: " + dto.getSupplierId()));
            entity.setSupplier(supplier);
        } else {
            entity.setSupplier(null);
        }

        entity.setBags(dto.getBags());
        entity.setWeightKg(dto.getWeightKg());
        entity.setBillNo(dto.getBillNo());
        entity.setRate(dto.getRate());
        entity.setGstPercent(dto.getGstPercent());

        // Calculate amount if not provided and rate & weight are present
        if (dto.getCalculatedAmount() != null) {
            entity.setCalculatedAmount(dto.getCalculatedAmount());
        } else if (dto.getWeightKg() != null && dto.getRate() != null) {
            BigDecimal baseAmount = dto.getWeightKg().multiply(dto.getRate());
            if (dto.getGstPercent() != null && dto.getGstPercent().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal gstMultiplier = BigDecimal.ONE.add(
                        dto.getGstPercent().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
                entity.setCalculatedAmount(baseAmount.multiply(gstMultiplier).setScale(2, RoundingMode.HALF_UP));
            } else {
                entity.setCalculatedAmount(baseAmount.setScale(2, RoundingMode.HALF_UP));
            }
        }

        entity.setActualAmount(dto.getActualAmount());
        entity.setPaymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : "UNPAID");
        entity.setPaidDate(dto.getPaidDate());
        entity.setPaidAmount(dto.getPaidAmount() != null ? dto.getPaidAmount() : BigDecimal.ZERO);
        entity.setReceivedPayment(dto.getReceivedPayment() != null ? dto.getReceivedPayment() : BigDecimal.ZERO);
        entity.setBillAmount(dto.getBillAmount());
        entity.setRemark(dto.getRemark());
        entity.setRemark2(dto.getRemark2());
    }
}
