package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailsDto {
    private Long orderId;
    private String orderNo;
    private Long partyId;
    private String customerName;
    private String quality;
    private Integer totalEnds;
    private BigDecimal cone;
    private Long countId;
    private Long tickitId;
    private String status;
}
