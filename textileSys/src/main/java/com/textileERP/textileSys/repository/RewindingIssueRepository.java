package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.RewindingIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RewindingIssueRepository extends JpaRepository<RewindingIssue, Long> {
    Optional<RewindingIssue> findByGetpassNoIgnoreCase(String getpassNo);
    boolean existsByGetpassNoIgnoreCase(String getpassNo);
}
