package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RewindingYarnReceiveLineDto {
    private String packageType;
    private String countAndTicket;
    private BigDecimal packagesCount;
    private BigDecimal grossWeightKg;
    private String destinationWarehouse;
    private String remark;
}
