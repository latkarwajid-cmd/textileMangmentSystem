package com.textileERP.textileSys.repository;

import com.textileERP.textileSys.model.YarnOutDyeing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YarnOutDyeingRepository extends JpaRepository<YarnOutDyeing, Long> {

    List<YarnOutDyeing> findBySizingSetSizingSetId(Long sizingSetId);

    List<YarnOutDyeing> findByOrderOrderId(Long orderId);
}