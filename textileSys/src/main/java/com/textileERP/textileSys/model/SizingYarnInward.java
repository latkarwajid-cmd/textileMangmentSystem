package com.textileERP.textileSys.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "sizing_yarn_inward")
public class SizingYarnInward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sizing_inward_id")
    private Long sizingInwardId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sizing_set_id")
    private SizingSet sizingSet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private FabricOrder order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sizing_id")
    private SizingUnit sizingUnit;

    @Column(name = "inward_date")
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

    @Column(name = "item_type", length = 50)
    private String itemType;

    @Column(name = "cones_returned", precision = 12, scale = 3)
    private BigDecimal conesReturned;

    @Column(name = "cones_per_bag", precision = 12, scale = 3)
    private BigDecimal conesPerBag;

    @Column(name = "destination_warehouse", length = 150)
    private String destinationWarehouse;

    @Column(name = "count_and_ticket", length = 200)
    private String countAndTicket;

    @Column(name = "issued_bags", precision = 12, scale = 3)
    private BigDecimal issuedBags;

    @Column(name = "issued_cones", precision = 12, scale = 3)
    private BigDecimal issuedCones;

    @Column(name = "issued_gross_weight", precision = 12, scale = 3)
    private BigDecimal issuedGrossWeight;

    @Column(name = "empty_cone_tare_grams", precision = 8, scale = 3)
    private BigDecimal emptyConeTareGrams;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "party_id")
    private Parties party;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "archived")
    private Boolean archived = false;
}
