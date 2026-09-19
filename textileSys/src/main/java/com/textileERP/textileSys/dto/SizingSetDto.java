package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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
    private String sizingCount;
    private String status;
}