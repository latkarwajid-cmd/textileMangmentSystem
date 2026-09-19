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
@Table(name = "yarn_out_sizing")
public class YarnOutSizing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "yarn_out_sizing_id")
    private Long yarnOutSizingId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sizing_set_id", nullable = false)
    private SizingSet sizingSet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tickit_id")
    private Tickits tickit;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private FabricOrder order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "count_id")
    private YarnCount yarnCount;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "party_id")
    private Parties party;

    @Column(name = "out_date", nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate outDate;

    @Column(name = "bags", precision = 12, scale = 3)
    private BigDecimal bags;

    @Column(name = "cone", precision = 12, scale = 3)
    private BigDecimal cone;

    @Column(name = "weight_kg", precision = 12, scale = 3)
    private BigDecimal weightKg;

    @Column(name = "rate", precision = 12, scale = 2)
    private BigDecimal rate;

    @Column(name = "bill_no", length = 50)
    private String billNo;

    @Column(name = "amount", precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "total_end")
    private BigDecimal totalEnd;

    @Column(name = "sizing_mtr", precision = 14, scale = 3)
    private BigDecimal sizingMtr;

    @Column(name = "sizing_received_khard", precision = 14, scale = 3)
    private BigDecimal sizingReceivedKhart;

    @Column(name = "sizing_fresh_yarn_received", precision = 14, scale = 3)
    private BigDecimal sizingFreshYarnReceived;

    @Column(name = "balance_in_sizing", precision = 14, scale = 3)
    private BigDecimal balanceInSizing;

    @Column(name = "sizing_consumption", precision = 14, scale = 3)
    private BigDecimal sizingConsumption;

    @Column(name = "sizing_count", precision = 14, scale = 3)
    private BigDecimal sizingCount;

    @Column(name = "status", length = 50)
    private String status;
}
