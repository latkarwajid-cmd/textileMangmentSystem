package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.FabricOrderDto;
import com.textileERP.textileSys.model.FabricOrder;
import com.textileERP.textileSys.model.Parties;
import com.textileERP.textileSys.repository.FabricOrderRepository;
import com.textileERP.textileSys.repository.PartiesRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class FabricOrderService {

    private final FabricOrderRepository fabricOrderRepository;
    private final PartiesRepository partiesRepository;

    public FabricOrderService(FabricOrderRepository fabricOrderRepository, PartiesRepository partiesRepository) {
        this.fabricOrderRepository = fabricOrderRepository;
        this.partiesRepository = partiesRepository;
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

    // Delete Order
    public void deleteOrder(Long id) {
        FabricOrder order = getOrderById(id);
        fabricOrderRepository.delete(order);
    }
}
