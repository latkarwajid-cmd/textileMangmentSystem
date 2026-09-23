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
public class BeamInwardBatchDto {

    private String inwardNo;

    private LocalDate inwardDate;

    private String challanNo;

    private LocalDate challanDate;

    private Long sizingSetId;

    private Long orderId;

    private Long sizingId;

    private Long partyId;

    private String shed;

    private String quality;

    private Long countId;

    private Long tickitId;

    private Integer totalEnds;

    private Integer totalBeamsCount;

    private String remark;

    private List<BeamLineItemDto> beamLines = new ArrayList<>();
}
