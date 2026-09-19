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
        private Long beamInwardId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sizing_set_id")
    private SizingSet sizingSet;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private FabricOrder order;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sizing_id")
    private SizingUnit sizingUnit;

    @Column(name = "inward_date", nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        private LocalDate date;



        @Column(name = "beams")
        private Integer beams;

        @Column(name = "d_no")
        private String dNo;

        @Column(name = "cut", precision = 14, scale = 2)
        private BigDecimal cut;

        @Column(name = "mtrs", precision = 14, scale = 2)
        private BigDecimal mtrs;

        @Column(name = "pick", precision = 14, scale = 2)
        private BigDecimal pick;

        @Column(name = "fold", precision = 14, scale = 2)
        private BigDecimal fold;

        @Column(name = "rs", precision = 14, scale = 2)
        private BigDecimal rs;

        @Column(name = "lasa", precision = 14, scale = 2)
        private BigDecimal lasa;
    }

