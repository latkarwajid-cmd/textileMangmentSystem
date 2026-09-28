package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RewindingIssueLineDto {
    private Long yarnInwardId;
    private Long sizingInwardId;
    private String setNo;
    private String seNo;
    private String countName;
    private String tickitName;
    private BigDecimal bags;
    private BigDecimal cone;
    private BigDecimal weightKg;
    private String targetOutputType;
    private String remark;
}
