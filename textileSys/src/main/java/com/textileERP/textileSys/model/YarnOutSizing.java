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
@Table(name = "yarn_out_sizing")
public class YarnOutSizing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "yarn_out_sizing_id")
    private Long yarnOutSizingId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sizing_set_id", nullable = false)
    private SizingSet sizingSet;

    @Column(name = "out_date", nullable = false)
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
}
