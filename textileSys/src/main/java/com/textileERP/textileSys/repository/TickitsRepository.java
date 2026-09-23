package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.Tickits;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TickitsRepository extends JpaRepository<Tickits, Long> {

    // Get only active tickits
    List<Tickits> findByActiveTrue();

    // Check duplicate tickit name while creating
    boolean existsByTickitNameIgnoreCase(
            String tickitName
    );

    // Check duplicate tickit name while updating
    // Excludes the current tickit ID
    boolean existsByTickitNameIgnoreCaseAndTickitIdNot(
            String tickitName,
            Long tickitId
    );
}