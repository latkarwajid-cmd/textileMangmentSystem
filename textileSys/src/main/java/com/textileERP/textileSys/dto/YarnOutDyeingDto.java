package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class YarnOutDyeingDto {

    private Long sizingSetId;
    private Long orderId;
    private LocalDate outDate;
    private Long countId;
    private Long tickitId;
    private Long sizingId;
    private Long partyId;
    private BigDecimal bags;
    private BigDecimal weightKg;
    private String quality;
    private Integer totalEnds;
    private BigDecimal sizingMeters;
    private BigDecimal sizingReceivedWeight;
    private BigDecimal freshBagsReceived;
    private BigDecimal balanceInSizing;
    private BigDecimal sizingConsumptionKg;
    private String sizingCount;
    private String billNo;
    private String status;
}