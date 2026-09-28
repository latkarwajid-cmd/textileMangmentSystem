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

    private String gatePassNo;
    private Long yarnInwardId;
    private Long sizingInwardId;
    private String setNo;
    private Long sizingSetId;
    private Long orderId;
    private LocalDate outDate;
    private String firmName;
    private Long countId;
    private Long tickitId;
    private Long dyeingUnitId;
    private BigDecimal bags;
    private BigDecimal cone;
    private BigDecimal weightKg;
    private String targetShade;
    private String dyeingType;
    private String remark;
}
