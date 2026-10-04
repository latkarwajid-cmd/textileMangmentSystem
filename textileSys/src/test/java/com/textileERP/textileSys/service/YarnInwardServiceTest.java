package com.textileERP.textileSys.service;

import com.textileERP.textileSys.dto.YarnInwardDto;
import com.textileERP.textileSys.model.RewindingIssue;
import com.textileERP.textileSys.model.RewindingYarnReceive;
import com.textileERP.textileSys.model.RewindingYarnReceiveLine;
import com.textileERP.textileSys.model.YarnInward;
import com.textileERP.textileSys.model.YarnOutDyeing;
import com.textileERP.textileSys.model.YarnReceiveDyeing;
import com.textileERP.textileSys.repository.FabricOrderRepository;
import com.textileERP.textileSys.repository.PartiesRepository;
import com.textileERP.textileSys.repository.SizingUnitRepository;
import com.textileERP.textileSys.repository.TickitsRepository;
import com.textileERP.textileSys.repository.YarnCountRepository;
import com.textileERP.textileSys.repository.YarnInwardRepository;
import com.textileERP.textileSys.repository.YarnStorageLocationRepository;
import com.textileERP.textileSys.repository.RewindingYarnReceiveRepository;
import com.textileERP.textileSys.repository.YarnReceiveDyeingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class YarnInwardServiceTest {

    @Mock
    private YarnInwardRepository yarnInwardRepository;
    @Mock
    private FabricOrderRepository fabricOrderRepository;
    @Mock
    private YarnCountRepository yarnCountRepository;
    @Mock
    private TickitsRepository tickitsRepository;
    @Mock
    private PartiesRepository partiesRepository;
    @Mock
    private YarnStorageLocationRepository yarnStorageLocationRepository;
    @Mock
    private SizingUnitRepository sizingUnitRepository;
    @Mock
    private RewindingYarnReceiveRepository rewindingReceiveRepository;
    @Mock
    private YarnReceiveDyeingRepository dyeingReceiveRepository;

    @InjectMocks
    private YarnInwardService service;

    @Test
    void create_shouldDefaultTypeToFresh() {
        YarnInwardDto request = new YarnInwardDto();
        request.setBags(new BigDecimal("10"));
        when(yarnInwardRepository.save(any(YarnInward.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        YarnInward saved = service.createYarnInward(request);

        assertEquals("FRESH", saved.getType());
    }

    @Test
    void create_shouldPreserveSpecialSourceType() {
        YarnInwardDto request = new YarnInwardDto();
        request.setType("DYED");
        when(yarnInwardRepository.save(any(YarnInward.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        YarnInward saved = service.createYarnInward(request);

        assertEquals("DYED", saved.getType());
    }

    @Test
    void getAll_shouldExcludeInventoryFromArchivedRewindingAndDyeingSources() {
        YarnInward deletedRewindingStock = inward(11L, "RW-11-0");
        YarnInward deletedDyeingStock = inward(22L, "DY-2-DYED-2");
        YarnInward regularStock = inward(33L, "REGULAR");

        RewindingIssue archivedRewindingIssue = new RewindingIssue();
        archivedRewindingIssue.setArchived(true);
        archivedRewindingIssue.setGetpassNo("RW-11");
        RewindingYarnReceive rewindingReceive = new RewindingYarnReceive();
        rewindingReceive.setRewindingIssue(archivedRewindingIssue);
        RewindingYarnReceiveLine rewindingLine = new RewindingYarnReceiveLine();
        rewindingLine.setInventoryYarnInwardId(11L);
        rewindingReceive.setLines(List.of(rewindingLine));

        YarnOutDyeing archivedDyeingIssue = new YarnOutDyeing();
        archivedDyeingIssue.setArchived(true);
        YarnReceiveDyeing dyeingReceive = new YarnReceiveDyeing();
        dyeingReceive.setYarnReceiveDyeingId(2L);
        dyeingReceive.setGatePassNo("DY-2");
        dyeingReceive.setYarnOutDyeing(archivedDyeingIssue);

        when(yarnInwardRepository.findAll())
                .thenReturn(List.of(deletedRewindingStock, deletedDyeingStock, regularStock));
        when(rewindingReceiveRepository.findAll()).thenReturn(List.of(rewindingReceive));
        when(dyeingReceiveRepository.findAll()).thenReturn(List.of(dyeingReceive));

        assertEquals(List.of(regularStock), service.getAllYarnInwards());
    }

    @Test
    void update_shouldSetTypeToRemainingWhenBagsDecrease() {
        assertUpdateType("10", "7", "REMAINING");
    }

    @Test
    void update_shouldSetTypeToFreshWhenBagsIncrease() {
        assertUpdateType("10", "12", "FRESH");
    }

    @Test
    void update_shouldSetTypeToFreshWhenBagCountIsUnchanged() {
        assertUpdateType("10", "10", "FRESH");
    }

    private void assertUpdateType(String existingBags, String updatedBags, String expectedType) {
        YarnInward existing = new YarnInward();
        existing.setYarnInwardId(1L);
        existing.setBags(new BigDecimal(existingBags));
        existing.setType("REMAINING");

        YarnInwardDto request = new YarnInwardDto();
        request.setBags(new BigDecimal(updatedBags));

        when(yarnInwardRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(yarnInwardRepository.save(any(YarnInward.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        YarnInward saved = service.updateYarnInward(1L, request);

        assertEquals(expectedType, saved.getType());
    }

    private YarnInward inward(Long id, String billNo) {
        YarnInward inward = new YarnInward();
        inward.setYarnInwardId(id);
        inward.setBillNo(billNo);
        inward.setArchived(false);
        return inward;
    }
}
