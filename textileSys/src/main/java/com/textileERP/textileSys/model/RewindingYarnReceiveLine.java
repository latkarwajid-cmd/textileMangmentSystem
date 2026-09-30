package com.textileERP.textileSys.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "rewinding_yarn_receive_line")
public class RewindingYarnReceiveLine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rewindingYarnReceiveLineId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rewinding_yarn_receive_id", nullable = false)
    @JsonBackReference
    private RewindingYarnReceive receive;

    @Column(name = "package_type", length = 20, nullable = false)
    private String packageType;

    @Column(name = "count_and_ticket", length = 200)
    private String countAndTicket;

    @Column(name = "packages_count", precision = 12, scale = 3, nullable = false)
    private BigDecimal packagesCount;

    @Column(name = "gross_weight_kg", precision = 12, scale = 3, nullable = false)
    private BigDecimal grossWeightKg;

    @Column(name = "destination_warehouse", length = 150)
    private String destinationWarehouse;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "inventory_yarn_inward_id")
    private Long inventoryYarnInwardId;
}
