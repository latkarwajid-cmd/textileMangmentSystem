package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.YarnStorageLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YarnStorageLocationRepository extends JpaRepository<YarnStorageLocation, Long> {

    List<YarnStorageLocation> findByActiveTrue();
}
