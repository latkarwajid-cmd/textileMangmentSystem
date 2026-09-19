package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.Tickits;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TickitsRepository extends JpaRepository<Tickits, Long> {

    List<Tickits> findByActiveTrue();

    List<Tickits> findByPartyPartyIdAndActiveTrue(Long partyId);

    Optional<Tickits> findByTickitNameIgnoreCaseAndPartyPartyId(String tickitName, Long partyId);

    boolean existsByTickitNameIgnoreCaseAndPartyPartyId(String tickitName, Long partyId);

    boolean existsByTickitNameIgnoreCaseAndPartyPartyIdAndTickitIdNot(String tickitName, Long partyId, Long tickitId);
}
