package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BeamInwardDto {

    private Long sizingSetId;

    private Long orderId;

    private Long sizingId;

    private LocalDate date;

    private Integer beams;

    private String dNo;

    private BigDecimal cut;

    private BigDecimal mtrs;

    private BigDecimal pick;

    private BigDecimal fold;

    private BigDecimal rs;

    private BigDecimal lasa;
}