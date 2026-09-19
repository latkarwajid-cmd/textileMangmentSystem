package com.textileERP.textileSys.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "sizing_sets")
public class SizingSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sizing_set_id")
    private Long sizingSetId;

    @Column(name = "set_no", length = 50, nullable = false, unique = true)
    private String setNo;

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

    @Column(name = "sizing_count", length = 50)
    private String sizingCount;

    @Column(name = "status", length = 30)
    private String status = "OPEN";
}
