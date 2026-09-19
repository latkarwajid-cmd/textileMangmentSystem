package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SizingYarnInwardDto {

    private Long sizingSetId;
    private Long orderId;
    private Long sizingId;
    private LocalDate inwardDate;
    private Long countId;
    private Long tickitId;
    private BigDecimal bags;
    private BigDecimal weightKg;
    private Long partyId;
    private String remark;
}
