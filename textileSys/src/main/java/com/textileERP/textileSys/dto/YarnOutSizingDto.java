package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class YarnOutSizingDto {

    private Long sizingSetId;

    private Long tickitId;

    private Long orderId;

    private Long countId;

    private Long partyId;

    private LocalDate outDate;

    private BigDecimal bags;

    private BigDecimal cone;

    private BigDecimal weightKg;

    private BigDecimal rate;

    private String billNo;

    private BigDecimal amount;


    // New Yarn Out Sizing field

    private BigDecimal totalEnd;

    private BigDecimal sizingMtr;

    private BigDecimal sizingReceivedKhart;

    private BigDecimal sizingFreshYarnReceived;

    private BigDecimal balanceInSizing;

    private BigDecimal sizingConsumption;

    private BigDecimal sizingCount;

    private String status;
}