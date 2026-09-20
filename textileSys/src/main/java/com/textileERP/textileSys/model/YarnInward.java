package com.textileERP.textileSys.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "yarn_inward")
public class YarnInward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "yarn_inward_id")
    private Long yarnInwardId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private FabricOrder order;

    @Column(name = "inward_date", nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate inwardDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "count_id")
    private YarnCount count;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tickit_id")
    private Tickits tickit;

    @Column(name = "bags", precision = 12, scale = 3)
    private BigDecimal bags;

    @Column(name = "weight_kg", precision = 12, scale = 3)
    private BigDecimal weightKg;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    private Parties supplier;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "storage_location_id")
    private YarnStorageLocation storageLocation;

    @Column(name = "bill_no", length = 50)
    private String billNo;

    @Column(name = "rate", precision = 12, scale = 2)
    private BigDecimal rate;

    @Column(name = "gst_percent", precision = 5, scale = 2)
    private BigDecimal gstPercent;

    @Column(name = "calculated_amount", precision = 14, scale = 2)
    private BigDecimal calculatedAmount;

    @Column(name = "actual_amount", precision = 14, scale = 2)
    private BigDecimal actualAmount;

    @Column(name = "payment_status", length = 20)
    private String paymentStatus = "UNPAID";

    @Column(name = "paid_date")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate paidDate;

    @Column(name = "paid_amount", precision = 14, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "received_payment", precision = 14, scale = 2)
    private BigDecimal receivedPayment = BigDecimal.ZERO;

    @Column(name = "bill_amount", precision = 14, scale = 2)
    private BigDecimal billAmount;

//NEW CHANGES IN DB
    @Column(name = "days")
    private Integer days;

    @Column(name = "receivable", precision = 14, scale = 2)
    private BigDecimal receivable;

    @Column(name = "tcs", precision = 14, scale = 2)
    private BigDecimal tcs;

    @Column(name = "add_amount", precision = 14, scale = 2)
    private BigDecimal addAmount;

    @Column(name = "gst", precision = 14, scale = 2)
    private BigDecimal gst;

    @Column(name = "tds", precision = 14, scale = 2)
    private BigDecimal tds;

    @Column(name = "interest", precision = 14, scale = 2)
    private BigDecimal interest;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "remark2", columnDefinition = "TEXT")
    private String remark2;


}
