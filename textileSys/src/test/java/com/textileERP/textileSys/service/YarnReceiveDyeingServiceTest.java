package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnInventoryLinkDto;
import com.textileERP.textileSys.model.YarnOutDyeing;
import com.textileERP.textileSys.model.YarnReceiveDyeing;
import com.textileERP.textileSys.repository.YarnOutDyeingRepository;
import com.textileERP.textileSys.repository.YarnReceiveDyeingRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class YarnReceiveDyeingServiceTest {

    @Test
    void getAllExcludesReceiptsFromArchivedDyeingIssues() {
        YarnOutDyeing activeIssue = new YarnOutDyeing();
        activeIssue.setArchived(false);
        YarnReceiveDyeing activeReceipt = receipt(1L, activeIssue, false);

        YarnOutDyeing archivedIssue = new YarnOutDyeing();
        archivedIssue.setArchived(true);
        YarnReceiveDyeing archivedIssueReceipt = receipt(2L, archivedIssue, false);

        YarnReceiveDyeingRepository repository = mock(YarnReceiveDyeingRepository.class);
        when(repository.findAll()).thenReturn(List.of(activeReceipt, archivedIssueReceipt));
        YarnReceiveDyeingService service = new YarnReceiveDyeingService(
                repository,
                mock(YarnOutDyeingRepository.class),
                mock(YarnInwardService.class)
        );

        assertEquals(List.of(activeReceipt), service.getAll());
    }

    @Test
    void getInventoryLinksMarksArchivedIssueInventoryInactive() {
        YarnOutDyeing issue = new YarnOutDyeing();
        issue.setArchived(true);
        YarnReceiveDyeing receipt = receipt(44L, issue, false);
        receipt.setGatePassNo("DY-4");

        YarnReceiveDyeingRepository repository = mock(YarnReceiveDyeingRepository.class);
        when(repository.findAll()).thenReturn(List.of(receipt));
        YarnInwardService yarnInwardService = mock(YarnInwardService.class);
        when(yarnInwardService.findIdsByBillNo("DY-4-DYED-44")).thenReturn(List.of(404L));
        YarnReceiveDyeingService service = new YarnReceiveDyeingService(
                repository,
                mock(YarnOutDyeingRepository.class),
                yarnInwardService
        );

        assertEquals(List.of(new YarnInventoryLinkDto(404L, false)), service.getInventoryLinks());
    }

    @Test
    void deleteArchivesGeneratedInventory() {
        YarnOutDyeing issue = new YarnOutDyeing();
        YarnReceiveDyeing receipt = receipt(44L, issue, false);
        receipt.setGatePassNo("DY-4");

        YarnReceiveDyeingRepository repository = mock(YarnReceiveDyeingRepository.class);
        when(repository.findById(44L)).thenReturn(java.util.Optional.of(receipt));
        YarnInwardService yarnInwardService = mock(YarnInwardService.class);
        YarnReceiveDyeingService service = new YarnReceiveDyeingService(
                repository,
                mock(YarnOutDyeingRepository.class),
                yarnInwardService
        );

        service.delete(44L);

        verify(yarnInwardService).archiveYarnInwardByBillNo("DY-4-DYED-44");
        assertEquals(true, receipt.getArchived());
    }

    private YarnReceiveDyeing receipt(Long id, YarnOutDyeing issue, boolean archived) {
        YarnReceiveDyeing receipt = new YarnReceiveDyeing();
        receipt.setYarnReceiveDyeingId(id);
        receipt.setYarnOutDyeing(issue);
        receipt.setArchived(archived);
        return receipt;
    }
}
