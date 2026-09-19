package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.Parties;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PartiesRepository extends JpaRepository<Parties, Long> {

    Optional<Parties> findByPartyNameIgnoreCase(String partyName);

    boolean existsByPartyNameIgnoreCase(String partyName);

    List<Parties> findByStatusTrue();
}
