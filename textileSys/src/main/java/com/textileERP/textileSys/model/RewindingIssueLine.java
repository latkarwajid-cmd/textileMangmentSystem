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
@Table(name = "rewinding_issue_line")
public class RewindingIssueLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rewinding_issue_line_id")
    private Long rewindingIssueLineId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rewinding_issue_id", nullable = false)
    @JsonBackReference
    private RewindingIssue rewindingIssue;

    @Column(name = "yarn_inward_id")
    private Long yarnInwardId;

    @Column(name = "sizing_inward_id")
    private Long sizingInwardId;

    @Column(name = "set_no", length = 100)
    private String setNo;

    @Column(name = "se_no", length = 100)
    private String seNo;

    @Column(name = "count_name", length = 100)
    private String countName;

    @Column(name = "tickit_name", length = 100)
    private String tickitName;

    @Column(name = "bags", precision = 12, scale = 3)
    private BigDecimal bags;

    @Column(name = "cone", precision = 12, scale = 3)
    private BigDecimal cone;

    @Column(name = "weight_kg", precision = 12, scale = 3)
    private BigDecimal weightKg;

    @Column(name = "target_output_type", length = 30)
    private String targetOutputType;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;
}
