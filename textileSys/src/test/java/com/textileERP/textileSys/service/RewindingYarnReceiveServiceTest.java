package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnInventoryLinkDto;
import com.textileERP.textileSys.model.RewindingIssue;
import com.textileERP.textileSys.model.RewindingYarnReceive;
import com.textileERP.textileSys.model.RewindingYarnReceiveLine;
import com.textileERP.textileSys.repository.RewindingIssueRepository;
import com.textileERP.textileSys.repository.RewindingYarnReceiveRepository;
import com.textileERP.textileSys.repository.YarnStorageLocationRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RewindingYarnReceiveServiceTest {

    @Test
    void getInventoryLinks_marksDeletedIssueInventoryInactive() {
        RewindingIssue activeIssue = new RewindingIssue();
        activeIssue.setArchived(false);
        RewindingYarnReceive activeReceipt = receipt(activeIssue, 101L);

        RewindingIssue deletedIssue = new RewindingIssue();
        deletedIssue.setArchived(true);
        RewindingYarnReceive deletedReceipt = receipt(deletedIssue, 202L);

        RewindingYarnReceiveRepository repository = mock(RewindingYarnReceiveRepository.class);
        when(repository.findAll()).thenReturn(List.of(activeReceipt, deletedReceipt));

        RewindingYarnReceiveService service = new RewindingYarnReceiveService(
                mock(RewindingIssueRepository.class),
                repository,
                mock(YarnInwardService.class),
                mock(YarnStorageLocationRepository.class)
        );

        assertEquals(
                List.of(
                        new YarnInventoryLinkDto(101L, true),
                        new YarnInventoryLinkDto(202L, false)
                ),
                service.getInventoryLinks()
        );
    }

    @Test
    void getInventoryLinksFindsLegacyInventoryByGeneratedBillNumber() {
        RewindingIssue issue = new RewindingIssue();
        issue.setGetpassNo("RW-21");
        issue.setArchived(true);
        RewindingYarnReceive receive = receipt(issue, null);

        RewindingYarnReceiveRepository repository = mock(RewindingYarnReceiveRepository.class);
        when(repository.findAll()).thenReturn(List.of(receive));
        YarnInwardService yarnInwardService = mock(YarnInwardService.class);
        when(yarnInwardService.findIdsByBillNo("RW-21-0")).thenReturn(List.of(303L));

        RewindingYarnReceiveService service = new RewindingYarnReceiveService(
                mock(RewindingIssueRepository.class),
                repository,
                yarnInwardService,
                mock(YarnStorageLocationRepository.class)
        );

        assertEquals(List.of(new YarnInventoryLinkDto(303L, false)), service.getInventoryLinks());
    }

    private RewindingYarnReceive receipt(RewindingIssue issue, Long inventoryId) {
        RewindingYarnReceive receive = new RewindingYarnReceive();
        receive.setRewindingIssue(issue);

        RewindingYarnReceiveLine line = new RewindingYarnReceiveLine();
        line.setReceive(receive);
        line.setInventoryYarnInwardId(inventoryId);
        receive.setLines(List.of(line));

        return receive;
    }
}
