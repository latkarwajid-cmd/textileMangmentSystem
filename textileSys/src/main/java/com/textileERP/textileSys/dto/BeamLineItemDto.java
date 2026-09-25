package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BeamLineItemDto {

    private Integer srNo;

    private String beamNo;

    private String flangeNo;

    private BigDecimal cuts;

    private BigDecimal meter;

    private BigDecimal grossWeight;

    private BigDecimal tareWeight;

    private BigDecimal weightKg;

    private BigDecimal netWeight;

    private String status;

    private String storedAt;

    private String remark;
}
