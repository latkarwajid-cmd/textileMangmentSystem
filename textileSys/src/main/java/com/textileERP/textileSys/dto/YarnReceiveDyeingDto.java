package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class YarnReceiveDyeingDto {
    private Long dyeingOutId;
    private String gatePassNo;
    private LocalDate receiveDate;
    private String partyGatePassNo;
    private BigDecimal receivedWeight;
    private BigDecimal wastage;
    private String remarks;
    private String targetShade;
}
