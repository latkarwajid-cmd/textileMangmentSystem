package com.textileERP.textileSys.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "sizingSet")
@ToString(exclude = "sizingSet")
@Table(name = "sizing_set_yarn_lines")
public class SizingSetYarnLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "yarn_line_id")
    private Long yarnLineId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sizing_set_id", nullable = false)
    @JsonBackReference
    private SizingSet sizingSet;

    @Column(name = "sr_no")
    private Integer srNo;

    @Column(name = "source_from", length = 40)
    private String sourceFrom;

    @Column(name = "fresh_winding", length = 20)
    private String freshWinding;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "count_id")
    private YarnCount count;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tickit_id")
    private Tickits tickit;

    @Column(name = "bags", precision = 12, scale = 3)
    private BigDecimal bags;

    @Column(name = "cones", precision = 12, scale = 3)
    private BigDecimal cones;

    @Column(name = "weight_kg", precision = 10, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "weight_per_bag", precision = 12, scale = 3)
    private BigDecimal weightPerBag;

    @Column(name = "remark", length = 500)
    private String remark;

    /*
     * Yarn In source
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "yarn_inward_id")
    private YarnInward yarnInward;

    /*
     * Sizing In source
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sizing_inward_id")
    private SizingYarnInward sizingInward;
}