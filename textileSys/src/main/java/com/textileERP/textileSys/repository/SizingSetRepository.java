package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.SizingSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SizingSetRepository extends JpaRepository<SizingSet, Long> {

    Optional<SizingSet> findBySetNoIgnoreCase(String setNo);

    boolean existsBySetNoIgnoreCase(String setNo);

    List<SizingSet> findByStatusIgnoreCase(String status);

    List<SizingSet> findByOrderOrderId(Long orderId);

    List<SizingSet> findByPartyPartyId(Long partyId);

    List<SizingSet> findBySizingUnitSizingId(Long sizingId);
}
