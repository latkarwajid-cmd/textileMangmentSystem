package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.FabricOrderDto;
import com.textileERP.textileSys.dto.OrderDetailsDto;
import com.textileERP.textileSys.model.FabricOrder;
import com.textileERP.textileSys.model.Parties;
import com.textileERP.textileSys.model.Tickits;
import com.textileERP.textileSys.model.YarnCount;
import com.textileERP.textileSys.repository.FabricOrderRepository;
import com.textileERP.textileSys.repository.PartiesRepository;
import com.textileERP.textileSys.repository.TickitsRepository;
import com.textileERP.textileSys.repository.YarnCountRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class FabricOrderService {

    private final FabricOrderRepository fabricOrderRepository;
    private final PartiesRepository partiesRepository;
    private final YarnCountRepository yarnCountRepository;
    private final TickitsRepository tickitsRepository;

    public FabricOrderService(FabricOrderRepository fabricOrderRepository, PartiesRepository partiesRepository,
            YarnCountRepository yarnCountRepository, TickitsRepository tickitsRepository) {
        this.fabricOrderRepository = fabricOrderRepository;
        this.partiesRepository = partiesRepository;
        this.yarnCountRepository = yarnCountRepository;
        this.tickitsRepository = tickitsRepository;
    }

    // Get all orders
    public List<FabricOrder> getAllOrders() {
        return fabricOrderRepository.findAll();
    }

    // Get by ID
    public FabricOrder getOrderById(Long id) {
        return fabricOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Fabric order not found with id: " + id));
    }

    public OrderDetailsDto getOrderDetailsByOrderNo(String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw new RuntimeException("Order number is required");
        }
        String clean = orderNo.trim();
        java.util.Optional<FabricOrder> orderOpt = fabricOrderRepository.findByOrderNoIgnoreCase(clean);
        if (orderOpt.isEmpty()) {
            try {
                Long id = Long.parseLong(clean);
                orderOpt = fabricOrderRepository.findById(id);
            } catch (NumberFormatException ignored) {}
        }
        if (orderOpt.isEmpty() && clean.toLowerCase().startsWith("order ")) {
            String sub = clean.substring(6).trim();
            orderOpt = fabricOrderRepository.findByOrderNoIgnoreCase(sub);
        }
        FabricOrder order = orderOpt
                .orElseThrow(() -> new RuntimeException("Fabric order not found with order no: " + orderNo));

        OrderDetailsDto details = new OrderDetailsDto();
        details.setOrderId(order.getOrderId());
        details.setOrderNo(order.getOrderNo());
        details.setPartyId(order.getParty() != null ? order.getParty().getPartyId() : null);
        details.setCustomerName(order.getParty() != null ? order.getParty().getPartyName() : null);
        details.setQuality(order.getQuality());
        Integer totalEnds = parseTotalEnds(order.getQuality());
        details.setTotalEnds(totalEnds);
        details.setCone(parseCone(order.getQuality(), totalEnds));
        details.setCountId(order.getCount() != null ? order.getCount().getCountId() : null);
        details.setTickitId(order.getTickit() != null ? order.getTickit().getTickitId() : null);
        details.setStatus(order.getStatus());
        return details;
    }

    private Integer parseTotalEnds(String quality) {
        if (quality == null || quality.isBlank()) {
            return null;
        }
        java.util.regex.Matcher endsMatcher = java.util.regex.Pattern.compile("(?i)ends?\\s*[:=-]?\\s*(\\d+)").matcher(quality);
        if (endsMatcher.find()) {
            return Integer.parseInt(endsMatcher.group(1));
        }
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\b(\\d{4,})\\b").matcher(quality);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }
        return null;
    }

    private BigDecimal parseCone(String quality, Integer totalEnds) {
        if (quality != null && !quality.isBlank()) {
            java.util.regex.Matcher coneMatcher = java.util.regex.Pattern.compile("(?i)cones?\\s*[:=-]?\\s*(\\d+(?:\\.\\d+)?)").matcher(quality);
            if (coneMatcher.find()) {
                try {
                    return new BigDecimal(coneMatcher.group(1));
                } catch (Exception ignored) {}
            }
        }
        return null;
    }

    // Get by Party ID
    public List<FabricOrder> getOrdersByPartyId(Long partyId) {
        return fabricOrderRepository.findByPartyPartyId(partyId);
    }

    // Get by Status
    public List<FabricOrder> getOrdersByStatus(String status) {
        return fabricOrderRepository.findByStatusIgnoreCase(status);
    }

    // Create Order
    public FabricOrder createOrder(FabricOrderDto request) {
        if (request.getPartyId() == null) {
            throw new RuntimeException("Party ID is required for fabric order");
        }

        if (fabricOrderRepository.existsByOrderNoIgnoreCase(request.getOrderNo())) {
            throw new RuntimeException("Fabric order already exists with order no: " + request.getOrderNo());
        }

        Parties party = partiesRepository.findById(request.getPartyId())
                .orElseThrow(() -> new RuntimeException("Party not found with id: " + request.getPartyId()));

        FabricOrder order = new FabricOrder();
        order.setOrderNo(request.getOrderNo());
        order.setOrderDate(request.getOrderDate() != null ? request.getOrderDate() : LocalDate.now());
        order.setParty(party);
        order.setCount(findCount(request.getCountId()));
        order.setTickit(findTickit(request.getTickitId()));
        order.setSupplier(findParty(request.getSupplierId()));
        order.setQuality(request.getQuality());
        order.setRate(request.getRate());
        order.setOrderedMeters(request.getOrderedMeters());
        order.setDispatchedMeters(request.getDispatchedMeters() != null ? request.getDispatchedMeters() : BigDecimal.ZERO);
        order.setStatus(request.getStatus() != null ? request.getStatus() : "OPEN");
        order.setComplete(request.getComplete() != null ? request.getComplete() : false);

        return fabricOrderRepository.save(order);
    }

    // Update Order
    public FabricOrder updateOrder(Long id, FabricOrderDto request) {
        FabricOrder order = getOrderById(id);

        if (fabricOrderRepository.findByOrderNoIgnoreCase(request.getOrderNo())
                .filter(existing -> !existing.getOrderId().equals(id))
                .isPresent()) {
            throw new RuntimeException("Fabric order already exists with order no: " + request.getOrderNo());
        }

        if (request.getPartyId() != null) {
            Parties party = partiesRepository.findById(request.getPartyId())
                    .orElseThrow(() -> new RuntimeException("Party not found with id: " + request.getPartyId()));
            order.setParty(party);
        }

        order.setCount(findCount(request.getCountId()));
        order.setTickit(findTickit(request.getTickitId()));
        order.setSupplier(findParty(request.getSupplierId()));

        order.setOrderNo(request.getOrderNo());
        if (request.getOrderDate() != null) {
            order.setOrderDate(request.getOrderDate());
        }
        order.setQuality(request.getQuality());
        order.setRate(request.getRate());
        order.setOrderedMeters(request.getOrderedMeters());
        if (request.getDispatchedMeters() != null) {
            order.setDispatchedMeters(request.getDispatchedMeters());
        }
        if (request.getStatus() != null) {
            order.setStatus(request.getStatus());
        }
        if (request.getComplete() != null) {
            order.setComplete(request.getComplete());
        }

        return fabricOrderRepository.save(order);
    }

    private YarnCount findCount(Long id) {
        return id == null ? null : yarnCountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yarn count not found with id: " + id));
    }

    private Tickits findTickit(Long id) {
        return id == null ? null : tickitsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tickit not found with id: " + id));
    }

    private Parties findParty(Long id) {
        return id == null ? null : partiesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier party not found with id: " + id));
    }

    // Delete Order
    public void deleteOrder(Long id) {
        FabricOrder order = getOrderById(id);
        fabricOrderRepository.delete(order);
    }
}
