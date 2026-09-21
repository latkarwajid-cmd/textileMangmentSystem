package com.textileERP.textileSys.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActiveYarnGatePassDto {
    private Long yarnInwardId;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate inwardDate;
    private String billNo;
    private String orderNo;
    private String supplierName;
    private Long countId;
    private String countName;
    private Long tickitId;
    private String tickitName;
    private BigDecimal bags;
    private BigDecimal weightKg;
}
