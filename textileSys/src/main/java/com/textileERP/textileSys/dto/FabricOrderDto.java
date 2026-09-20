package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FabricOrderDto {

    private String orderNo;
    private LocalDate orderDate;
    private Long partyId;
    private Long countId;
    private Long tickitId;
    private Long supplierId;
    private String quality;
    private BigDecimal rate;
    private BigDecimal orderedMeters;
    private BigDecimal dispatchedMeters;
    private String status;
    private Boolean complete;
}
