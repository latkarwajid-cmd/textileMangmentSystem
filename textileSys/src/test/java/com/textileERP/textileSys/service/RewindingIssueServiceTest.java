package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.RewindingIssueDto;
import com.textileERP.textileSys.dto.RewindingIssueLineDto;
import com.textileERP.textileSys.model.RewindingIssue;
import com.textileERP.textileSys.model.YarnInward;
import com.textileERP.textileSys.repository.RewindingIssueRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RewindingIssueServiceTest {

    @Mock
    private RewindingIssueRepository repository;

    @Mock
    private YarnInwardService yarnInwardService;

    @InjectMocks
    private RewindingIssueService service;

    @Test
    void create_shouldIssueYarnFromSelectedInwardRows() {
        RewindingIssueDto dto = new RewindingIssueDto();
        dto.setGetpassNo("GP-100");
        dto.setFirmName("Alpha Textile");
        dto.setIssueDate(LocalDate.now());
        dto.setRewindingName("Jai Rewinding");

        RewindingIssueLineDto line = new RewindingIssueLineDto();
        line.setYarnInwardId(10L);
        line.setSeNo("SE-1");
        line.setCountName("20s");
        line.setTickitName("TK-1");
        line.setBags(new BigDecimal("5"));
        line.setCone(new BigDecimal("2"));
        line.setWeightKg(new BigDecimal("25.5"));
        line.setRemark("Issue to rewinding");
        dto.setLines(List.of(line));

        when(repository.existsByGetpassNoIgnoreCase("GP-100")).thenReturn(false);
        when(yarnInwardService.issueYarn(10L, new BigDecimal("5"), new BigDecimal("2")))
                .thenReturn(new YarnInward());
        when(repository.save(any(RewindingIssue.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RewindingIssue saved = service.create(dto);

        verify(yarnInwardService).issueYarn(10L, new BigDecimal("5"), new BigDecimal("2"));
        assertEquals(10L, saved.getLines().get(0).getYarnInwardId());
    }
}
