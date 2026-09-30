package com.textileERP.textileSys.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "rewinding_yarn_receive")
public class RewindingYarnReceive {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rewindingYarnReceiveId;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "rewinding_issue_id", nullable = false, unique = true)
    private RewindingIssue rewindingIssue;

    @Column(name = "receive_date", nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate receiveDate;

    @Column(name = "returned_empty_cones", precision = 12, scale = 3)
    private BigDecimal returnedEmptyCones = BigDecimal.ZERO;

    @Column(name = "scrap_weight_kg", precision = 12, scale = 3)
    private BigDecimal scrapWeightKg = BigDecimal.ZERO;

    @Column(name = "balance_return_weight_kg", precision = 12, scale = 3)
    private BigDecimal balanceReturnWeightKg = BigDecimal.ZERO;

    @OneToMany(mappedBy = "receive", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<RewindingYarnReceiveLine> lines = new ArrayList<>();
}
