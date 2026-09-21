package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SizingSetDto {

    private String setNo;
    private Long orderId;
    private Long countId;
    private Long tickitId;
    private Long sizingId;
    private Long partyId;
    private String quality;
    private Integer totalEnds;
    private BigDecimal sizingMeters;
    private LocalDate outDate;
    private BigDecimal bags;
    private BigDecimal cone;
    private BigDecimal weightKg;
    private BigDecimal rate;
    private String billNo;
    private BigDecimal amount;
    private BigDecimal totalEnd;
    private BigDecimal sizingMtr;
    private BigDecimal sizingReceivedKhart;
    private BigDecimal sizingFreshYarnReceived;
    private BigDecimal balanceInSizing;
    private BigDecimal sizingConsumption;
    private BigDecimal sizingCount;
    private String status;
}