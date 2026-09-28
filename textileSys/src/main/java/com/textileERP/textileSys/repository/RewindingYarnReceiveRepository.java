package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.RewindingYarnReceive;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RewindingYarnReceiveRepository extends JpaRepository<RewindingYarnReceive, Long> {
    Optional<RewindingYarnReceive> findByRewindingIssueGetpassNoIgnoreCase(String getpassNo);
}
