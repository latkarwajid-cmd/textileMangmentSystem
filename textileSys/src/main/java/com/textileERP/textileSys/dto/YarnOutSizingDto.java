package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class YarnOutSizingDto {

    private Long sizingSetId;
    private LocalDate outDate;
    private BigDecimal bags;
    private BigDecimal cone;
    private BigDecimal weightKg;
    private BigDecimal rate;
    private String billNo;
    private BigDecimal amount;
}
