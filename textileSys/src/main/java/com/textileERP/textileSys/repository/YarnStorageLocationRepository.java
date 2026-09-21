package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.YarnStorageLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface YarnStorageLocationRepository extends JpaRepository<YarnStorageLocation, Long> {

    List<YarnStorageLocation> findByActiveTrue();

    Optional<YarnStorageLocation> findByLocationNameIgnoreCase(String locationName);
}
