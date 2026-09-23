package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BalanceReturnItemDto {

    private Integer srNo;

    private String itemType; // 'Full Bag', 'Partial / Loose Bag', 'Empty Cones Scrap'

    private Long countId;

    private Long tickitId;

    private String countAndTicket;

    private BigDecimal bagsReturned;

    private BigDecimal conesReturned;

    private BigDecimal returnedWeightKg;

    private String destinationWarehouse; // e.g. 'Main Raw Yarn Warehouse'

    private String remark;
}
