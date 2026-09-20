package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BeamInwardDto {

    private Long sizingSetId;

    private Long orderId;

    private Long sizingId;

    private LocalDate inwardDate;

    private String beamNo;

    private String quality;

    private Long countId;

    private Long tickitId;

    private BigDecimal meter;

    private BigDecimal weightKg;

    private Long partyId;

    private String status;

    private String remark;
}