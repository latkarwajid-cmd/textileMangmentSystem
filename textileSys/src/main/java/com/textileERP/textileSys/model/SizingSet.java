package com.textileERP.textileSys.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "yarnLines")
@ToString(exclude = "yarnLines")
@Table(name = "sizing_sets")
public class SizingSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sizing_set_id")
    private Long sizingSetId;

    @Column(name = "set_no", length = 50, nullable = false, unique = true)
    private String setNo;

    @Column(name = "set_date")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate setDate;

    @Column(name = "part_no", length = 50)
    private String partNo;

    @Column(name = "lasa", length = 255)
    private String lasa;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private FabricOrder order;

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

    @Column(name = "quality", length = 255)
    private String quality;

    @Column(name = "total_ends")
    private Integer totalEnds;

    @Column(name = "sizing_meters", precision = 12, scale = 3)
    private BigDecimal sizingMeters;

    /*
     * Fields moved from YarnOutSizing
     */

    @Column(name = "out_date")
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

    @Column(name = "sizing_count", length = 50)
    private String sizingCount;

    @Column(name = "status", length = 50)
    private String status;

    @OneToMany(
            mappedBy = "sizingSet",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.EAGER
    )
    @JsonManagedReference
    private List<SizingSetYarnLine> yarnLines = new ArrayList<>();
}