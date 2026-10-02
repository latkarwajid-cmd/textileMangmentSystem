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
@Table(name = "yarn_receive_dyeing")
public class YarnReceiveDyeing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "yarn_receive_dyeing_id")
    private Long yarnReceiveDyeingId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "dyeing_out_id", nullable = false)
    private YarnOutDyeing yarnOutDyeing;

    @Column(name = "gate_pass_no", length = 50)
    private String gatePassNo;

    @Column(name = "receive_date")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate receiveDate;

    @Column(name = "party_name", length = 150)
    private String partyGatePassNo;

    @Column(name = "received_weight", precision = 12, scale = 3)
    private BigDecimal receivedWeight;

    @Column(name = "wastage", precision = 12, scale = 3)
    private BigDecimal wastage;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "target_shade", length = 100)
    private String targetShade;

    @Column(name = "archived")
    private Boolean archived = false;
}
