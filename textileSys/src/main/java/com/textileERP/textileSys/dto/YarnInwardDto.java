package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class YarnInwardDto {

    private Long orderId;
    private LocalDate inwardDate;
    private Long countId;
    private Long tickitId;
    private BigDecimal bags;
    private BigDecimal weightKg;
    private Long supplierId;
    private String billNo;
    private BigDecimal rate;
    private BigDecimal gstPercent;
    private BigDecimal calculatedAmount;
    private BigDecimal actualAmount;
    private String paymentStatus;
    private LocalDate paidDate;
    private BigDecimal paidAmount;
    private BigDecimal receivedPayment;
    private BigDecimal billAmount;

    private Integer days;
    private BigDecimal receivable;
    private BigDecimal tcs;
    private BigDecimal addAmount;
    private BigDecimal gst;
    private BigDecimal tds;
    private BigDecimal interest;

    private String remark;
    private String remark2;
}