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

    private String inwardNo;

    private String challanNo;

    private LocalDate challanDate;

    private Long sizingSetId;

    private Long orderId;

    private Long sizingId;

    private LocalDate inwardDate;

    private String shed;

    private String beamNo;

    private String flangeNo;

    private String quality;

    private Long countId;

    private Long tickitId;

    private Integer totalEnds;

    private Integer totalBeamsCount;

    private BigDecimal cuts;

    private BigDecimal meter;

    private BigDecimal grossWeight;

    private BigDecimal tareWeight;

    private BigDecimal weightKg;

    private BigDecimal netWeight;

    private Long partyId;

    private String status;

    private String storedAt;

    private String remark;
}
