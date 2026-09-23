package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class YarnReconciliationDto {

    private BigDecimal totalIssuedBags;

    private BigDecimal totalIssuedCones;

    private BigDecimal issuedGrossWeight;

    private BigDecimal emptyConeTareGrams; // Defaults to 60g

    private BigDecimal totalEmptyConeTareKg;

    private BigDecimal netYarnIssuedKg;

    private BigDecimal totalReturnedWeightKg;

    private BigDecimal netYarnConsumedKg;

    private List<BalanceReturnItemDto> returnsList = new ArrayList<>();
}
