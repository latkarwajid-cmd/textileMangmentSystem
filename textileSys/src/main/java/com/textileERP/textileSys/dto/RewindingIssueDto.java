package com.textileERP.textileSys.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RewindingIssueDto {
    private String getpassNo;
    private String firmName;
    private LocalDate issueDate;
    private String rewindingName;
    private String remark;
    private List<RewindingIssueLineDto> lines = new ArrayList<>();
}
