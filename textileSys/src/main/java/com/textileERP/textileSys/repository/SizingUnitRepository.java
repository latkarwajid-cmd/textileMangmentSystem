package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.SizingUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SizingUnitRepository extends JpaRepository<SizingUnit, Long> {

    List<SizingUnit> findByActiveTrue();

    List<SizingUnit> findByPartyPartyIdAndActiveTrue(Long partyId);

    Optional<SizingUnit> findBySizingNameIgnoreCaseAndPartyPartyId(String sizingName, Long partyId);

    boolean existsBySizingNameIgnoreCaseAndPartyPartyId(String sizingName, Long partyId);

    boolean existsBySizingNameIgnoreCaseAndPartyPartyIdAndSizingIdNot(String sizingName, Long partyId, Long sizingId);

    boolean existsBySizingNameIgnoreCaseAndPartyIsNull(String sizingName);

    boolean existsBySizingNameIgnoreCaseAndPartyIsNullAndSizingIdNot(String sizingName, Long sizingId);
}
