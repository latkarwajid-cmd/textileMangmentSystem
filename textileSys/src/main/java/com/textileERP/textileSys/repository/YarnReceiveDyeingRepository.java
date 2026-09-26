package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.YarnReceiveDyeing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YarnReceiveDyeingRepository extends JpaRepository<YarnReceiveDyeing, Long> {
    List<YarnReceiveDyeing> findByGatePassNo(String gatePassNo);

    List<YarnReceiveDyeing> findByYarnOutDyeingDyeingOutId(Long dyeingOutId);
}
