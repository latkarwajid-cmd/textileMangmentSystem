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
        @Column(name = "beam_id")
        private Long beamId;

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



        @Column(name = "beam_no", length = 50)
        private String beamNo;

        @ManyToOne(fetch = FetchType.EAGER)
        @JoinColumn(name = "count_id")
        private YarnCount count;

        @ManyToOne(fetch = FetchType.EAGER)
        @JoinColumn(name = "tickit_id")
        private Tickits tickit;

        @Column(name = "meter", precision = 12, scale = 3)
        private BigDecimal meter;

        @Column(name = "weight_kg", precision = 12, scale = 3)
        private BigDecimal weightKg;

        @ManyToOne(fetch = FetchType.EAGER)
        @JoinColumn(name = "party_id")
        private Parties party;

        @Column(name = "status", length = 30)
        private String status;

        @Column(name = "remark", columnDefinition = "TEXT")
        private String remark;
    }

