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
@Table(name = "beam_inward")
public class BeamInward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "beam_inward_id")
    private Long beamId;

    @Column(name = "inward_no", length = 50)
    private String inwardNo;

    @Column(name = "challan_no", length = 50)
    private String challanNo;

    @Column(name = "challan_date")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate challanDate;

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

    @Column(name = "shed", length = 100)
    private String shed;

    @Column(name = "beam_no", length = 50)
    private String beamNo;

    @Column(name = "flange_no", length = 50)
    private String flangeNo;

    @Column(name = "quality", length = 255)
    private String quality;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "count_id")
    private YarnCount count;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "tickit_id")
    private Tickits tickit;

    @Column(name = "total_ends")
    private Integer totalEnds;

    @Column(name = "total_beams_count")
    private Integer totalBeamsCount;

    @Column(name = "cuts", precision = 10, scale = 2)
    private BigDecimal cuts;

    @Column(name = "meter", precision = 12, scale = 3)
    private BigDecimal meter;

    @Column(name = "gross_weight", precision = 12, scale = 3)
    private BigDecimal grossWeight;

    @Column(name = "tare_weight", precision = 12, scale = 3)
    private BigDecimal tareWeight;

    @Column(name = "weight_kg", precision = 12, scale = 3)
    private BigDecimal weightKg;

    @Column(name = "net_weight", precision = 12, scale = 3)
    private BigDecimal netWeight;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "party_id")
    private Parties party;

    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
}


