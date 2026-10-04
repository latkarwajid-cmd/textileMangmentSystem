package com.textileERP.textileSys.service;

import com.textileERP.textileSys.model.BeamInward;
import com.textileERP.textileSys.repository.BeamInwardRepository;
import com.textileERP.textileSys.repository.FabricOrderRepository;
import com.textileERP.textileSys.repository.PartiesRepository;
import com.textileERP.textileSys.repository.SizingSetRepository;
import com.textileERP.textileSys.repository.SizingUnitRepository;
import com.textileERP.textileSys.repository.SizingYarnInwardRepository;
import com.textileERP.textileSys.repository.TickitsRepository;
import com.textileERP.textileSys.repository.YarnCountRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BeamInwardServiceTest {

    @Test
    void getAll_shouldExcludeArchivedAndDeletedRecords() {
        BeamInwardRepository repository = mock(BeamInwardRepository.class);
        BeamInward active = new BeamInward();
        active.setBeamNo("1");
        BeamInward archived = new BeamInward();
        archived.setBeamNo("7");
        archived.setArchived(true);
        BeamInward deletedStatus = new BeamInward();
        deletedStatus.setBeamNo("8");
        deletedStatus.setStatus("DELETED");
        when(repository.findAll()).thenReturn(List.of(active, archived, deletedStatus));

        assertEquals(List.of(active), createService(repository).getAll());
    }

    private BeamInwardService createService(BeamInwardRepository repository) {
        return new BeamInwardService(
                repository,
                mock(SizingSetRepository.class),
                mock(FabricOrderRepository.class),
                mock(SizingUnitRepository.class),
                mock(YarnCountRepository.class),
                mock(TickitsRepository.class),
                mock(PartiesRepository.class),
                mock(SizingYarnInwardRepository.class)
        );
    }
}
