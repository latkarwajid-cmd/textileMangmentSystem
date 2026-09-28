package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RewindingYarnReceiveDto {
    private String getpassNo;
    private LocalDate receiveDate;
    private BigDecimal returnedEmptyCones;
    private BigDecimal scrapWeightKg;
    private BigDecimal balanceReturnWeightKg;
    private List<RewindingYarnReceiveLineDto> lines = new ArrayList<>();
}
