package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.RewindingIssueDto;
import com.textileERP.textileSys.dto.RewindingIssueLineDto;
import com.textileERP.textileSys.model.RewindingIssue;
import com.textileERP.textileSys.model.RewindingYarnReceive;
import com.textileERP.textileSys.model.RewindingYarnReceiveLine;
import com.textileERP.textileSys.model.YarnInward;
import com.textileERP.textileSys.repository.RewindingIssueRepository;
import com.textileERP.textileSys.repository.RewindingYarnReceiveRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

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

    @Mock
    private RewindingYarnReceiveRepository receiveRepository;

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
        when(yarnInwardService.issueYarn(10L, new BigDecimal("5"), new BigDecimal("2"), new BigDecimal("25.5")))
                .thenReturn(new YarnInward());
        when(repository.save(any(RewindingIssue.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RewindingIssue saved = service.create(dto);

        verify(yarnInwardService).issueYarn(10L, new BigDecimal("5"), new BigDecimal("2"), new BigDecimal("25.5"));
        assertEquals(10L, saved.getLines().get(0).getYarnInwardId());
    }

    @Test
    void delete_shouldArchiveGeneratedYarnInwardRows() {
        RewindingIssue issue = new RewindingIssue();
        issue.setRewindingIssueId(7L);
        issue.setGetpassNo("GP-7");

        RewindingYarnReceive receive = new RewindingYarnReceive();
        RewindingYarnReceiveLine line = new RewindingYarnReceiveLine();
        line.setInventoryYarnInwardId(71L);
        receive.setLines(List.of(line));

        when(repository.findById(7L)).thenReturn(Optional.of(issue));
        when(receiveRepository.findByRewindingIssueGetpassNoIgnoreCase("GP-7"))
                .thenReturn(Optional.of(receive));

        service.delete(7L);

        verify(yarnInwardService).archiveYarnInward(71L);
        verify(repository).save(issue);
    }
}
