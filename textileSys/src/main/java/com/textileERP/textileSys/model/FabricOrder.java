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
@Table(name = "fabric_orders")
public class FabricOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "order_no", length = 50, nullable = false, unique = true)
    private String orderNo;

    @Column(name = "order_date", nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate orderDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "party_id", nullable = false)
    private Parties party;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "count_id")
    private YarnCount count;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tickit_id")
    private Tickits tickit;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    private Parties supplier;

    @Column(name = "quality", length = 255)
    private String quality;

    @Column(name = "rate", precision = 12, scale = 2)
    private BigDecimal rate;

    @Column(name = "ordered_meters", precision = 12, scale = 3)
    private BigDecimal orderedMeters;

    @Column(name = "dispatched_meters", precision = 12, scale = 3)
    private BigDecimal dispatchedMeters = BigDecimal.ZERO;

    @Column(name = "status", length = 30)
    private String status = "OPEN";

    @Column(name = "complete")
    private Boolean complete = false;
}
