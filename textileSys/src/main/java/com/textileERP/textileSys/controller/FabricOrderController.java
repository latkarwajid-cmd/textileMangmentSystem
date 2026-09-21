package com.textileERP.textileSys.controller;

import com.textileERP.textileSys.dto.FabricOrderDto;
import com.textileERP.textileSys.dto.OrderDetailsDto;
import com.textileERP.textileSys.model.FabricOrder;
import com.textileERP.textileSys.service.FabricOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/fabric-orders", "/api/fabricorders", "/api/orders"})
@CrossOrigin(origins = "*")
public class FabricOrderController {

    private final FabricOrderService fabricOrderService;

    public FabricOrderController(FabricOrderService fabricOrderService) {
        this.fabricOrderService = fabricOrderService;
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<List<FabricOrder>> getAllOrders() {
        return ResponseEntity.ok(fabricOrderService.getAllOrders());
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<FabricOrder> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(fabricOrderService.getOrderById(id));
    }

    @GetMapping("/{orderNo}/details")
    public ResponseEntity<OrderDetailsDto> getOrderDetails(@PathVariable String orderNo) {
        return ResponseEntity.ok(fabricOrderService.getOrderDetailsByOrderNo(orderNo));
    }

    // GET BY PARTY ID
    @GetMapping("/party/{partyId}")
    public ResponseEntity<List<FabricOrder>> getOrdersByPartyId(@PathVariable Long partyId) {
        return ResponseEntity.ok(fabricOrderService.getOrdersByPartyId(partyId));
    }

    // GET BY STATUS
    @GetMapping("/status/{status}")
    public ResponseEntity<List<FabricOrder>> getOrdersByStatus(@PathVariable String status) {
        return ResponseEntity.ok(fabricOrderService.getOrdersByStatus(status));
    }

    // CREATE
    @PostMapping
    public ResponseEntity<FabricOrder> createOrder(@RequestBody FabricOrderDto request) {
        FabricOrder savedOrder = fabricOrderService.createOrder(request);
        return new ResponseEntity<>(savedOrder, HttpStatus.CREATED);
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<FabricOrder> updateOrder(
            @PathVariable Long id,
            @RequestBody FabricOrderDto request) {
        FabricOrder updatedOrder = fabricOrderService.updateOrder(id, request);
        return ResponseEntity.ok(updatedOrder);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteOrder(@PathVariable Long id) {
        fabricOrderService.deleteOrder(id);
        return ResponseEntity.ok("Fabric order deleted successfully");
    }
}
