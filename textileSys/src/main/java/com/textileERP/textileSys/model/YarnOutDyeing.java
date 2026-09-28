package com.textileERP.textileSys.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "yarn_out_dyeing")
public class YarnOutDyeing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dyeing_out_id")
    private Long dyeingOutId;

    @Column(name = "gate_pass_no", length = 50)
    private String gatePassNo;

    @Column(name = "yarn_inward_id")
    private Long yarnInwardId;

    @Column(name = "sizing_inward_id")
    private Long sizingInwardId;

    @Column(name = "set_no", length = 100)
    private String setNo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sizing_set_id")
    private SizingSet sizingSet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private FabricOrder order;

    @Column(name = "out_date")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate outDate;

    @Column(name = "firm_name", length = 150)
    private String firmName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "count_id")
    private YarnCount count;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tickit_id")
    private Tickits tickit;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sizing_id")
    private SizingUnit sizingUnit;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "party_id")
    private Parties party;

    @Column(name = "bags", precision = 12, scale = 3)
    private BigDecimal bags;

    @Column(name = "cone", precision = 12, scale = 3)
    private BigDecimal cone;

    @Column(name = "weight_kg", precision = 12, scale = 3)
    private BigDecimal weightKg;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "quality", length = 255)
    private String quality;

    @Column(name = "total_ends")
    private Integer totalEnds;

    @Column(name = "sizing_meters", precision = 12, scale = 3)
    private BigDecimal sizingMeters;

    @Column(name = "sizing_received_weight", precision = 12, scale = 3)
    private BigDecimal sizingReceivedWeight;

    @Column(name = "fresh_bags_received", precision = 12, scale = 3)
    private BigDecimal freshBagsReceived;

    @Column(name = "balance_in_sizing", precision = 12, scale = 3)
    private BigDecimal balanceInSizing;

    @Column(name = "sizing_consumption_kg", precision = 12, scale = 3)
    private BigDecimal sizingConsumptionKg;

    @Column(name = "sizing_count", length = 50)
    private String sizingCount;

    @Column(name = "bill_no", length = 50)
    private String billNo;

    @Column(name = "status", length = 30)
    private String status;

    @Column(name = "target_shade", length = 100)
    private String targetShade;

    @Column(name = "dyeing_type", length = 30)
    private String dyeingType;
}
