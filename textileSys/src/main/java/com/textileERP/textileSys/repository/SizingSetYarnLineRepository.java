package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.SizingSetYarnLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SizingSetYarnLineRepository extends JpaRepository<SizingSetYarnLine, Long> {
}
