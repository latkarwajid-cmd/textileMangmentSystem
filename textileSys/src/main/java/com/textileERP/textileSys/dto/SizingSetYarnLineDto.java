package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SizingSetYarnLineDto {

    private Long yarnLineId;

    private Integer srNo;

    private String sourceFrom;

    private String freshWinding;

    private Long countId;

    private Long tickitId;

    private BigDecimal bags;

    private BigDecimal cones;

    private BigDecimal weightKg;
    private BigDecimal weightPerBag;

    private String remark;

    private Long yarnInwardId;

    private Long sizingInwardId;
}