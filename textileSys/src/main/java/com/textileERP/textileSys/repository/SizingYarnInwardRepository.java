package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.SizingYarnInward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SizingYarnInwardRepository extends JpaRepository<SizingYarnInward, Long> {

    List<SizingYarnInward> findBySizingSetSizingSetId(Long sizingSetId);

    List<SizingYarnInward> findByOrderOrderId(Long orderId);

    List<SizingYarnInward> findBySizingUnitSizingId(Long sizingId);

    List<SizingYarnInward> findByPartyPartyId(Long partyId);

    List<SizingYarnInward> findByCountCountId(Long countId);

    List<SizingYarnInward> findByTickitTickitId(Long tickitId);

    List<SizingYarnInward> findByInwardDateBetween(LocalDate startDate, LocalDate endDate);
}
