package com.textileERP.textileSys.service;

import com.textileERP.textileSys.model.SizingSet;
import com.textileERP.textileSys.repository.FabricOrderRepository;
import com.textileERP.textileSys.repository.PartiesRepository;
import com.textileERP.textileSys.repository.SizingSetRepository;
import com.textileERP.textileSys.repository.SizingUnitRepository;
import com.textileERP.textileSys.repository.SizingYarnInwardRepository;
import com.textileERP.textileSys.repository.TickitsRepository;
import com.textileERP.textileSys.repository.YarnCountRepository;
import com.textileERP.textileSys.repository.YarnInwardRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SizingSetServiceTest {

    @Test
    void generateNextSetNo_ignoresDeletedSets() {
        SizingSetRepository repository = mock(SizingSetRepository.class);
        when(repository.findAll()).thenReturn(List.of(
                set("SET-04", "OPEN"),
                set("SET-25", "DELETED")
        ));

        assertEquals("SET-05", createService(repository).generateNextSetNo());
    }

    @Test
    void generateNextSetNo_startsAtOneWhenAllSetsAreDeleted() {
        SizingSetRepository repository = mock(SizingSetRepository.class);
        when(repository.findAll()).thenReturn(List.of(
                set("SET-04", "DELETED"),
                set("SET-25", "DELETED")
        ));

        assertEquals("SET-01", createService(repository).generateNextSetNo());
    }

    private SizingSetService createService(SizingSetRepository repository) {
        return new SizingSetService(
                repository,
                mock(FabricOrderRepository.class),
                mock(PartiesRepository.class),
                mock(SizingUnitRepository.class),
                mock(TickitsRepository.class),
                mock(YarnCountRepository.class),
                mock(YarnInwardRepository.class),
                mock(SizingYarnInwardRepository.class)
        );
    }

    private SizingSet set(String setNo, String status) {
        SizingSet sizingSet = new SizingSet();
        sizingSet.setSetNo(setNo);
        sizingSet.setStatus(status);
        return sizingSet;
    }
}
