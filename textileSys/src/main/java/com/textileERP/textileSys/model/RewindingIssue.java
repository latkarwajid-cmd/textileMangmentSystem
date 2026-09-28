package com.textileERP.textileSys.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "rewinding_issue",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_rewinding_getpass_no", columnNames = "getpass_no")
        }
)
public class RewindingIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rewinding_issue_id")
    private Long rewindingIssueId;

    @Column(name = "getpass_no", nullable = false, unique = true, length = 100)
    private String getpassNo;

    @Column(name = "firm_name", length = 200)
    private String firmName;

    @Column(name = "issue_date")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate issueDate;

    @Column(name = "rewinding_name", length = 200)
    private String rewindingName;

    @Column(name = "remark", columnDefinition = "TEXT")
    private String remark;

    @Column(name = "status", length = 20, nullable = false)
    @Convert(converter = RewindingStatusConverter.class)
    private RewindingStatus status = RewindingStatus.ISSUED;

    @OneToMany(mappedBy = "rewindingIssue", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<RewindingIssueLine> lines = new ArrayList<>();
}
