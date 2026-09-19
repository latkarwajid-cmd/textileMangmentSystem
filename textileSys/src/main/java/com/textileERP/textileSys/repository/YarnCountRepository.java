package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.YarnCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface YarnCountRepository extends JpaRepository<YarnCount, Long> {

    List<YarnCount> findByActiveTrue();

    Optional<YarnCount> findByCountNameIgnoreCase(String countName);

    boolean existsByCountNameIgnoreCase(String countName);

    boolean existsByCountNameIgnoreCaseAndCountIdNot(String countName, Long countId);
}
