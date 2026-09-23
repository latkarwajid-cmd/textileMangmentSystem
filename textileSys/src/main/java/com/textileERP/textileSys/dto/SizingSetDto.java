package com.textileERP.textileSys.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SizingSetDto {

    private String setNo;

    private LocalDate setDate;

    private String partNo;

    private String lasa;

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

    private String sizingCount;

    private String status;

    private List<SizingSetYarnLineDto> yarnLines = new ArrayList<>();
}